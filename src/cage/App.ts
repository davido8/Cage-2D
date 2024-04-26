import { easelFSText, easelVSText, lineFSText, lineVSText, pointFSText, pointVSText } from "./Shaders.js";
import { Vec4 } from "../lib/tsm/Vec4.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { Shader, UniformType } from "./Shader.js";
import { Handles } from "./Handles.js";

enum AnimationMode {
  Drawing,
  Deform
}

export class CageAnimation extends CanvasAnimation {
  private backgroundColor: Vec4;
  
  private width: number;
  private height: number;

  private dragging: boolean;

  private easelShader: Shader;
  private pointShader: Shader;
  private lineShader: Shader;

  private handles: Handles;
  private mode: AnimationMode;
  private static MAX_HANDLES = 64;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.width = canvas.width;
    this.height = canvas.height;
    this.backgroundColor = new Vec4([0.424, 0.725, 0.741, 1.0]);
    this.registerEventListeners();

    this.initPointShader();
    this.initLineShader();
    this.initEasel();
    
    this.handles = new Handles(this);

    this.dragging = false;
    this.mode = AnimationMode.Drawing;
  }

  private initPointShader(): void {
    this.pointShader = new Shader(this.ctx, pointVSText, pointFSText, this.ctx.POINTS);
    this.pointShader.addAttribute('a_position', [], 2);
    this.pointShader.addAttribute('a_offset', [], 2);
    this.pointShader.setNumDrawElements(0);
    this.pointShader.addUniform('u_resolution', [
      this.ctx.canvas.width, 
      this.ctx.canvas.height
    ], UniformType.FLOAT2);
  }

  private initLineShader(): void {
    this.lineShader = new Shader(this.ctx, lineVSText, lineFSText, this.ctx.LINES);
    this.lineShader.addAttribute('a_position', [], 2);
    this.lineShader.setNumDrawElements(0);
    this.lineShader.addUniform('u_resolution', [
      this.ctx.canvas.width, 
      this.ctx.canvas.height
    ], UniformType.FLOAT2);
  }

  private initEasel(): void {
    let widthOffset = this.width * 0.1;
    let heightOffset = this.height * 0.1;

    let left = widthOffset;
    let right = this.width - widthOffset;
    let top = heightOffset;
    let bottom = this.height - heightOffset;

    this.easelShader = new Shader(this.ctx, easelVSText, easelFSText, this.ctx.TRIANGLES);
    this.easelShader.addAttribute('a_position', [
      right, bottom,
      left, top,
      left, bottom,

      right, top,
      left, top,
      right, bottom
    ], 2);
    this.easelShader.setNumDrawElements(6);
    this.easelShader.addAttribute('a_texcoord', [
      1, 1,
      0, 0,
      0, 1,
      1, 0,
      0, 0,
      1, 1
    ], 2);
    this.easelShader.addTexture('static/pikmin.png');
    this.easelShader.addUniform('u_resolution', [this.ctx.canvas.width, this.ctx.canvas.height], UniformType.FLOAT2);
    this.easelShader.addUniform('u_handles', [], UniformType.FLOAT2ARRAY);
    this.easelShader.addUniform('u_offsets', [], UniformType.FLOAT2ARRAY);
    this.easelShader.addUniform('u_num_handles', [], UniformType.FLOAT);
  }

  /**
   * Setup the simulation. This can be called again to reset the program.
   */
  public reset(): void {    
  }

  /**
   * Draws a single frame
   *
   */
  public draw(): void {
    let gl = this.ctx;
    let bg = this.backgroundColor;

    // Tell WebGL how to convert from clip space to screen.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear canvas.
    gl.clearColor(bg.x, bg.y, bg.z, bg.w);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    let offsets = this.handles.getOffsets();
    let handles = this.handles.getHandles();

    this.pointShader.updateUniformData('u_offsets', offsets);
    this.easelShader.updateUniformData('u_handles', handles);
    this.easelShader.updateUniformData('u_offsets', offsets);
    console.log('u_num_handles: ' + handles.length / 2);
    this.easelShader.updateUniformData('u_num_handles', [handles.length / 2]);

    this.pointShader.draw();
    this.lineShader.draw();
    this.easelShader.draw();
  }

  private mouseClick(mouse: MouseEvent): void {
    console.log('Mouse clicked (' + mouse.clientX + ', ' + mouse.clientY + ')');

    if (this.mode == AnimationMode.Drawing) {
      let data = this.pointShader.getAttributeData('a_position');

      if (data.length == CageAnimation.MAX_HANDLES * 2) {
        console.error("ERROR: Max handles reached.");
        return;
      }

      this.handles.addHandle(mouse.clientX, mouse.clientY);


      // Create a new point at this position.
      let handles = this.handles.getHandles();
      this.pointShader.updateAttributeData('a_position', handles, 2);
      this.pointShader.setNumDrawElements(handles.length / 2);

      let offsets = this.handles.getOffsets();
      this.pointShader.updateAttributeData('a_offset', offsets, 2);

      let offsetData = this.pointShader.getAttributeData('a_offset');
      offsetData.push(0);
      offsetData.push(0);
      this.pointShader.updateAttributeData('a_offset', offsetData, 2);

    }
  }

  private mouseDrag(mouse: MouseEvent): void {
    if (this.dragging) {
      // Get position of last point added.
      let data = this.pointShader.getAttributeData('a_position');

      let lineData = data.slice();
      lineData.push(mouse.clientX);
      lineData.push(mouse.clientY);

      this.lineShader.updateAttributeData('a_position', lineData, 2);
      this.lineShader.setNumDrawElements(lineData.length / 2);
    }
  }

  private endLineDraw(): void {
    if (this.dragging) {
      this.dragging = false;
    }
  }

  private offsetHandle(offset: number): void {
    if (this.mode == AnimationMode.Deform) {
      this.handles.offsetHandle(0, offset, 0);
      this.handles.offsetHandle(1, -offset, 0);
      this.pointShader.updateAttributeData('a_offset', this.handles.getOffsets(), 2);
    }
  }

  private onKeydown(key: KeyboardEvent): void {
    switch (key.code) {
      case 'KeyR':
        this.handles.clearOffsets();
        this.mode = AnimationMode.Drawing;
        break;
      case 'Digit1':
        this.handles.clearOffsets();
        this.mode = AnimationMode.Drawing;
        break;
      case 'Digit2':
        this.mode = AnimationMode.Deform;
        break;
      case 'ArrowLeft':
        this.offsetHandle(-5);
        break;
      case 'ArrowRight':
        this.offsetHandle(5);
        break;
      case 'Escape':
        this.endLineDraw();
        break;
      default:
        console.log('Key ' + key.code + ' pressed.');
    }
  }

  private registerEventListeners(): void {
    window.addEventListener("mousedown", (mouse: MouseEvent) =>
      this.mouseClick(mouse)
    );

    window.addEventListener("mousemove", (mouse: MouseEvent) => 
      this.mouseDrag(mouse)
    );

    window.addEventListener("keydown", (key: KeyboardEvent) =>
      this.onKeydown(key)
    );


  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  const canvasAnimation: CageAnimation = new CageAnimation(canvas);
  canvasAnimation.start();  
}
