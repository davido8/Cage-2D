import { WebGLUtilities } from "../lib/webglutils/CanvasAnimation.js";

export enum UniformType {
    FLOAT,
    FLOAT2,
    FLOAT2ARRAY
}

class Attribute {
    private ctx: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vertexBuffer: WebGLBuffer;
    private vertexArray: WebGLVertexArrayObject;


    private data: number[];
    private location: number;

    constructor(
        gl: WebGL2RenderingContext, 
        program: WebGLProgram, 
        vao: WebGLVertexArrayObject,
        name: string, 
        data: number[],
        size: number
    ) {
        this.ctx = gl;

        gl.useProgram(program);

        let loc = gl.getAttribLocation(program, name);
        if (loc == -1) {
            console.error('ERROR: Attribute ' + name  + ' not found in shader.');
            return;
        }
        this.location = loc;
        this.program = program;

        // Put data into the buffer.
        let positionBuffer = gl.createBuffer();
        if (!positionBuffer) {
            console.error('ERROR: Could not create buffer.');
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        this.vertexBuffer = positionBuffer;

        // Tell the attribute how to pull data out of it.
        gl.bindVertexArray(vao);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(
            loc,
            size,
            gl.FLOAT,
            false,
            0,
            0
        );
        this.vertexArray = vao;
        console.log('Added ' + name + '.');

        this.data = data;
    }

    public updateData(newData: number[], elementSize: number) {
        let gl = this.ctx;

        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newData), gl.STATIC_DRAW);

        gl.bindVertexArray(this.vertexArray);
        gl.enableVertexAttribArray(this.location);
        gl.vertexAttribPointer(
            this.location,
            elementSize,
            gl.FLOAT,
            false,
            0,
            0
        );

        this.data = newData;
    }

    public getData(): number[] { return this.data; }
}

class Uniform {
    private ctx: WebGL2RenderingContext;
    private program: WebGLProgram;

    private data: number[];
    private location: WebGLUniformLocation;
    private type: UniformType;

    constructor(
        gl: WebGL2RenderingContext, 
        program: WebGLProgram, 
        name: string, 
        data: number[],
        type: UniformType
    ) {
        this.ctx = gl;

        gl.useProgram(program);
        let loc = gl.getUniformLocation(program, name);
        if (loc == null) {
            console.error('ERROR: Could not find uniform ' + name + '.');
            return;
        }
        this.location = loc;
        this.program = program;

        gl.useProgram(program);

        if (type == UniformType.FLOAT2) {
            gl.uniform2f(loc, data[0], data[1]);
        } else if (type == UniformType.FLOAT2ARRAY && data.length > 0) {
            gl.uniform2fv(loc, new Float32Array(data));
        } else if (this.type == UniformType.FLOAT) {
            gl.uniform1f(this.location, data[0]);
        }

        gl.useProgram(null);

        this.data = data;
        this.type = type;
    }

    public updateData(newData: number[]) {
        let gl = this.ctx;

        gl.useProgram(this.program);

        if (this.type == UniformType.FLOAT2) {
            gl.uniform2f(this.location, newData[0], newData[1]);
        } else if (this.type == UniformType.FLOAT2ARRAY && newData.length > 0) {
            gl.uniform2fv(this.location, new Float32Array(newData));
        } else if (this.type == UniformType.FLOAT) {
            gl.uniform1f(this.location, newData[0]);
        }

        gl.useProgram(null);

        this.data = newData;
    }

    public getData(): number[] { return this.data; }
}

export class Shader {
    private ctx: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vertexArray: WebGLVertexArrayObject;
    private numElements: number;
    private shapeType: GLenum;

    private attributes: Map<string, Attribute>;
    private uniforms: Map<string, Uniform>;

    constructor(ctx: WebGL2RenderingContext, vShaderText: string, fShaderText: string, type: GLenum) {
        this.ctx = ctx;
        this.program = WebGLUtilities.createProgram(ctx, vShaderText, fShaderText);
        let vao = this.ctx.createVertexArray();
        if (!vao) {
            console.error('ERROR: Could not create vertex array.');
            return;
        }
        this.vertexArray = vao;
        this.shapeType = type;
        
        this.attributes = new Map();
        this.uniforms = new Map();
    }

    public addAttribute(attrib: string, bufferData: number[], elementSize: number) {
        this.attributes.set(attrib, new Attribute(
            this.ctx, 
            this.program,
            this.vertexArray,
            attrib,
            bufferData,
            elementSize
        ));
    }

    public getAttributeData(attrib: string): number[] {
        let data = this.attributes.get(attrib)?.getData();
        return data === undefined ? [] : data;
    }

    public updateAttributeData(attrib: string, bufferData: number[], elementSize: number) {
        this.attributes.get(attrib)?.updateData(bufferData, elementSize);
    } 

    public addUniform(uniform: string, data: number[], type: UniformType): void {
        this.uniforms.set(uniform, new Uniform(
            this.ctx,
            this.program,
            uniform,
            data,
            type
        ));
    }

    public updateUniformData(uniform: string, bufferData: number[]) {
        this.uniforms.get(uniform)?.updateData(bufferData);
    } 

    /* Code adapted from https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html */
    public addTexture(imagename: string): void {
        let gl = this.ctx;

        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        var image = new Image();
        image.src = imagename;
        image.addEventListener('load', function() {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
    }

    public setNumDrawElements(num: number): void {
        this.numElements = num;
    }

    public draw(): void {
        let gl = this.ctx;

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vertexArray);

        gl.drawArrays(this.shapeType, 0, this.numElements);
    }
}