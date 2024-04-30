import { easelFSText, easelVSText, lineFSText, lineVSText, pointFSText, pointVSText } from "./Shaders.js";
import { Vec4 } from "../lib/tsm/Vec4.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { Shader, UniformType } from "./Shader.js";
import { Handles } from "./Handles.js";
import { Cage } from "./Cage.js";

enum AnimationMode {
  Drawing,
  Deform
}

export class CageAnimation extends CanvasAnimation {
  private backgroundColor: Vec4;
  
  private width: number;
  private height: number;

  private easelShader: Shader;
  private pointShader: Shader;
  private lineShader: Shader;

  // private handles: Handles;
  private cage: Cage;
  private mode: AnimationMode;
  private deforming: boolean;

  private static gridSize: number = 1000; // Number of squares along one edge of grid


  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.width = canvas.width;
    this.height = canvas.height;
    this.backgroundColor = new Vec4([0.424, 0.725, 0.741, 1.0]);
    this.registerEventListeners();

    this.reset();
  }

  /**
   * Setup the simulation. This can be called again to reset the program.
   */
  public reset(): void {    
    this.initPointShader();
    this.initLineShader();
    this.initEasel();
    
    this.cage = new Cage(this);
    this.mode = AnimationMode.Drawing;
    this.deforming = false;
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
    this.pointShader.addUniform('u_highlighted', [], UniformType.FLOAT2);
  }

  private initLineShader(): void {
    this.lineShader = new Shader(this.ctx, lineVSText, lineFSText, this.ctx.LINE_STRIP);
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

    let easelWidth = right - left;
    let easelHeight = bottom - top;

    let cellSize = easelWidth / CageAnimation.gridSize;
    right = left + cellSize;
    bottom = top + cellSize;

    this.easelShader = new Shader(this.ctx, easelVSText, easelFSText, this.ctx.TRIANGLES);
    this.easelShader.addAttribute('a_position', [
      right, bottom,
      left, top,
      left, bottom,

      right, top,
      left, top,
      right, bottom], 
      2
    );

    let uv: number[] = [];
    let colors: number[] = [];
    let translations: number[] = [];
    for (let i = 0; i < CageAnimation.gridSize; i++) {
      for (let j = 0; j < CageAnimation.gridSize; j++) {
        translations.push(i*cellSize);
        translations.push(j*cellSize);
        colors.push(Math.random());
        colors.push(Math.random());
        colors.push(Math.random());
        colors.push(Math.random());
        uv.push(i / 1.0);
        uv.push();
      }
    }

    this.easelShader.addInstancedAttribute('a_translation', translations, 2);
    this.easelShader.addInstancedAttribute('a_color', colors, 4);
    this.easelShader.setNumDrawElements(6);

    this.easelShader.addUniform('u_resolution', [this.ctx.canvas.width, this.ctx.canvas.height], UniformType.FLOAT2);
    this.easelShader.addUniform('u_gridSize', [easelWidth, easelHeight], UniformType.FLOAT2)
    this.easelShader.addTexture('static/pikmin.png');
  }

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

    let handles = this.cage.getVertices();
    let offsets = this.cage.getOffsets();

    this.pointShader.updateUniformData('u_highlighted', this.cage.getHighlighted());
    this.easelShader.updateUniformData('u_vertices', handles);
    this.easelShader.updateUniformData('u_offsets', offsets);
    this.easelShader.updateUniformData('u_num_handles', [handles.length / 2]);

    this.pointShader.draw();
    this.lineShader.draw();
    this.easelShader.drawInstanced(CageAnimation.gridSize**2);
  }

  private mouseClick(mouse: MouseEvent): void {
    // console.log('Mouse clicked (' + mouse.clientX + ', ' + mouse.clientY + ')');

    let rect = this.c.getBoundingClientRect();
    let x = mouse.clientX - rect.left;
    let y = mouse.clientY - rect.top;
    if (!(x >= 0 && x <= this.c.width && y >= 0 && y <= this.c.height)) {
      return;
    }

    if (this.mode == AnimationMode.Drawing) {
      this.cage.addPoint(x, y);
    }

    if (this.mode == AnimationMode.Deform) {
      // If not currently deforming, attempt to grab a vertex.
      if (!this.deforming) {
        if (this.cage.getHighlightedIndex() >= 0) {
          this.deforming = true;
        }
     }
    }
  }

  private mouseDrag(mouse: MouseEvent): void {
    let rect = this.c.getBoundingClientRect();
    let x = mouse.clientX - rect.left;
    let y = mouse.clientY - rect.top;
    if (!(x >= 0 && x <= this.c.width && y >= 0 && y <= this.c.height)) {
      return;
    }

    if (this.mode == AnimationMode.Deform) {
      if (this.deforming) {
        this.cage.offsetVertex(this.cage.getHighlightedIndex(), x, y);
      }
      else {
        // If not currently deforming, just set the highlighted vertex.
        let vertexNo = this.cage.getHoveredVertex(x, y);
        this.cage.setHighlighted(vertexNo);
        if (vertexNo == -2) {
          return;
        }
      }
    }

    if (this.mode == AnimationMode.Drawing && this.cage.isDrawing()) {
      this.cage.drawLineToCursor(x, y);
    }
  }

  private mouseUp(mouse: MouseEvent): void {
    if (this.mode == AnimationMode.Deform && this.deforming) {
      this.deforming = false;
    }
  }

  private onKeydown(key: KeyboardEvent): void {
    switch (key.code) {
      case 'KeyR':
        this.reset();
        break;
      case 'Enter':
        this.cage.closeCage();
        this.mode = AnimationMode.Deform;
        break;
      case 'Digit1':
        this.cage.clearOffsets();
        this.mode = AnimationMode.Drawing;
        break;
      case 'Digit2':
        this.mode = AnimationMode.Deform;
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

    window.addEventListener("mouseup", (mouse: MouseEvent) => 
      this.mouseUp(mouse)
    );
  }

  public getPointShader(): Shader { return this.pointShader; }
  public getLineShader(): Shader { return this.lineShader; }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  const canvasAnimation: CageAnimation = new CageAnimation(canvas);
  canvasAnimation.start();  
}
