import { easelFSText, easelVSText, lineFSText, lineVSText, pointFSText, pointVSText } from "./Shaders.js";
import { Vec4 } from "../lib/tsm/Vec4.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { Shader, UniformType } from "./Shader.js";
import { Handles } from "./Handles.js";
import { Cage } from "./Cage.js";
import { Vec2 } from "../lib/tsm/Vec2.js";

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

  private imageName: string;

  private activeCage: number;
  private cages: Cage[];
  private mode: AnimationMode;
  private deforming: boolean;

  private static gridSize: number = 1000; // Number of squares along one edge of grid


  constructor(canvas: HTMLCanvasElement, image: string) {
    super(canvas);

    this.width = canvas.width;
    this.height = canvas.height;
    this.backgroundColor = new Vec4([0.424, 0.725, 0.741, 1.0]);
    this.registerEventListeners();

    this.imageName = image;
    this.reset();
  }

  /**
   * Setup the simulation. This can be called again to reset the program.
   */
  public reset(): void {    
    this.initPointShader();
    this.initLineShader();
    this.initEasel(this.imageName);
    
    this.cages = new Cage(this);
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

  private initEasel(image: string): void {
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

    let translations: number[] = [];
    for (let i = 0; i < CageAnimation.gridSize; i++) {
      for (let j = 0; j < CageAnimation.gridSize; j++) {
        translations.push(i*cellSize);
        translations.push(j*cellSize);
      }
    }

    this.easelShader.addInstancedAttribute('a_translation', translations, 2);
    this.easelShader.setNumDrawElements(6);

    this.easelShader.addUniform('u_resolution', [this.ctx.canvas.width, this.ctx.canvas.height], UniformType.FLOAT2);
    this.easelShader.addUniform('u_gridSize', [easelWidth, easelHeight], UniformType.FLOAT2)
    this.easelShader.addUniform('u_numCageVertices', [], UniformType.FLOAT);
    this.easelShader.addUniform('u_vertices', [], UniformType.FLOAT2ARRAY);
    this.easelShader.addUniform('u_offsets', [], UniformType.FLOAT2ARRAY);
    this.easelShader.addUniform('u_cageGenerated', [], UniformType.FLOAT);
    this.easelShader.addTexture(image);
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
    let deform = this.cage.isClosed() ? 1 : 0;

    this.pointShader.updateUniformData('u_highlighted', this.cage.getHighlighted());
    this.easelShader.updateUniformData('u_vertices', handles);
    this.easelShader.updateUniformData('u_offsets', offsets);
    this.easelShader.updateUniformData('u_numCageVertices', [handles.length / 2]);
    this.easelShader.updateUniformData('u_cageGenerated', [deform]);

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

  private W(p0: Vec2, pi: Vec2, pi_plus: Vec2, pi_minus: Vec2): number {
    // Get all vectors we need.
    let p0_pi = Vec2.difference(pi, p0).normalize();
    let p0_piplus = Vec2.difference(pi_plus, p0).normalize();
    let p0_piminus = Vec2.difference(pi_minus, p0).normalize();

    // Get the dots and clamp them.
    let dot_alphai = Vec2.dot(p0_pi, p0_piplus);
    let dot_alphaj = Vec2.dot(p0_piminus, p0_pi);

    // Get the angles.
    let alphai = Math.acos(dot_alphai);
    let alphaj = Math.acos(dot_alphaj);

    let w = Math.tan(alphaj / 2.0) + Math.tan(alphai / 2.0);
    return w / Vec2.difference(pi, p0).length();
  }

  private lambda(p0: Vec2, target: number, cageVertices: Vec2[]): number {
    let numerator = 0.0;

    let cumsum = 0.0;
    for (let i = 0; i < cageVertices.length; i++) {
      let plus = (i + 1) % cageVertices.length;
      let minus = i - 1;
      if (minus < 0) {
        minus = cageVertices.length - 1;
      }

      let w = this.W(p0, cageVertices[i], cageVertices[plus], cageVertices[minus]);
      if (i == target) {
        numerator = w;
      }

      cumsum += w;
    }

    return numerator / cumsum;
  }

  private generateMVC(): void {
    // Turn cage vertices in vec2 array.
    let rawVertices = this.cage.getVertices();
    let cageVertices: Vec2[] = [];
    for (let i = 0; i < rawVertices.length; i += 2) {
      cageVertices.push(new Vec2([
        rawVertices[i], 
        rawVertices[i + 1]
      ]));
    }

    // Turn every grid vertex into a vec2.
    let rawPos = this.easelShader.getAttributeData('a_position');
    let rawOff = this.easelShader.getAttributeData('a_translation');
    let gridVertices: Vec2[] = [];
    for (let i = 0; i < rawOff.length; i += 2) {
      gridVertices.push(new Vec2([
        rawPos[0] + rawOff[i],
        rawPos[1] + rawOff[i + 1],
      ]));
    }

    let allWeights: number[] = [];

    // Calculate the weights of each cage vertex on each grid vertex.
    for (let i = 0; i < gridVertices.length; i++) {
      let gridVertex = gridVertices[i];

      for (let j = 0; j < cageVertices.length; j++) {
        allWeights.push(this.lambda(gridVertex, j, cageVertices));
      }

    }

    console.log(allWeights);
    this.easelShader.addDataTexture('u_mvc', allWeights, CageAnimation.gridSize*cageVertices.length, CageAnimation.gridSize);
  }

  private onKeydown(key: KeyboardEvent): void {
    switch (key.code) {
      case 'KeyR':
        this.reset();
        break;
      case 'Enter':
        this.cage.closeCage();
        // this.generateMVC();
        this.mode = AnimationMode.Deform;
        break;
      case 'KeyD':
        this.cage.clearOffsets();
        this.mode = AnimationMode.Drawing;
        break;
      case 'KeyM':
        this.mode = AnimationMode.Deform;
        break;
      case 'Digit1':
        this.imageName = 'static/pikmin.png';
        this.reset();
        break;
      case 'Digit2':
        this.imageName = 'static/debug.png';
        this.reset();
        break;
      case 'Digit3':
        this.imageName = 'static/croc.jpg';
        this.reset();
        break; 
      case 'Digit4':
        this.imageName = 'static/face.jpg';
        this.reset();
        break; 
      case 'Digit5':
        this.imageName = 'static/person.jpg';
        this.reset();
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
  const canvasAnimation: CageAnimation = new CageAnimation(canvas, 'static/pikmin.png');
  canvasAnimation.start();  
}
