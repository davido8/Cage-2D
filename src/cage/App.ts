import { Debugger } from "../lib/webglutils/Debugging.js";
import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { pointFSText, pointVSText } from "./Shaders.js";
import { Vec4 } from "../lib/tsm/Vec4.js";

export class CageAnimation extends CanvasAnimation {
  private gui: GUI;
  private canvas2d: HTMLCanvasElement;
  private backgroundColor: Vec4;

  private pointRenderPass: RenderPass;
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
  
    this.ctx = Debugger.makeDebugContext(this.ctx);
    let gl = this.ctx;

    this.pointRenderPass = new RenderPass(gl, pointVSText, pointFSText);
    this.initPointRenderPass();
        
    this.backgroundColor = new Vec4([0.0, 0.37254903, 0.37254903, 1.0]);    

    this.gui = new GUI(this.canvas2d, this);
  }

  private initPointRenderPass() {
    let indices = new Uint32Array([0]);
    let vertPos = new Float32Array([0, 0, 0, 0]);

    this.pointRenderPass.setIndexBufferData(indices);

    this.pointRenderPass.addAttribute(
      "aVertPos",
      4, 
      this.ctx.FLOAT,
      false,
      4*Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      vertPos
    );

    this.pointRenderPass.setDrawData(
      this.ctx.POINTS, 
      indices.length, 
      this.ctx.UNSIGNED_INT, 
      0
    );
    this.pointRenderPass.setup();    
  }

  /**
   * Setup the simulation. This can be called again to reset the program.
   */
  public reset(): void {    
      this.gui.reset();
  }

  /**
   * Draws a single frame
   *
   */
  public draw(): void {
    // Drawing
    const gl: WebGLRenderingContext = this.ctx;
    const bg: Vec4 = this.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
    gl.viewport(0, 0, 1280, 960);   
    
    this.pointRenderPass.draw();
  }

  public getGUI(): GUI {
    return this.gui;
  }  
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  const canvasAnimation: CageAnimation = new CageAnimation(canvas);
  canvasAnimation.start();  
}
