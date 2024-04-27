import { CageAnimation } from "./App";

export class Cage {
    private animation: CageAnimation;

    private vertices: number[];
    private offsets: number[]; 

    private lines: number[];

    private highlighted: number;

    private drawing: boolean;

    constructor(ani: CageAnimation) {
        this.vertices = [];
        this.offsets = [];
        this.lines = [];
        this.animation = ani;
        this.drawing = false;
        this.highlighted = -2;
    }

    public addPoint(x: number, y: number): void {
        /* Only support one cage at a time for now. */
        if (this.vertices.length != 0 && !this.drawing) {
            console.info("INFO: Reset cage in order to draw new cage.");
            return;
        }

        if (this.vertices.length == 0) {
            this.drawing = true;
        }

        /* Start drawing lines between last point and cursor. */
        if (this.vertices.length > 0) {
            this.addLine(
                this.vertices[this.vertices.length - 2],
                this.vertices[this.vertices.length - 1],
                x,
                y
            );
        }

        /* Add vertex with no initial offset. */
        this.vertices.push(x);
        this.vertices.push(y);
        this.offsets.push(0);
        this.offsets.push(0);

        /* Make sure to propagate changes to the shader. */
        this.updatePointShader();
    }

    public drawLineToCursor(x: number, y: number): void {
        if (!this.drawing) { console.error("ERROR: Adding line when not drawing."); return; }

        // Remove previous line first.
        this.removeLastLine();

        // Connect last point added to current mouse position.
        this.addLine(
            this.vertices[this.vertices.length - 2],
            this.vertices[this.vertices.length - 1],
            x,
            y
        );
    }

    public addLine(startX: number, startY: number, endX: number, endY: number): void {
        if (!this.drawing) { console.error("ERROR: Adding line when not drawing."); return; }

        this.lines.push(startX);
        this.lines.push(startY);
        this.lines.push(endX);
        this.lines.push(endY);

        this.updateLineShader();
    } 

    private removeLastLine(): void {
        this.lines.pop();
        this.lines.pop();
        this.lines.pop();
        this.lines.pop();
    }

    private resetLines(): void {
        this.lines = [];
        for (let j = 2; j < this.vertices.length; j += 2) {
            this.lines[j - 2] = this.vertices[j - 2]; 
            this.lines[j - 1] = this.vertices[j - 1]; 
            this.lines[j] = this.vertices[j]; 
            this.lines[j + 1] = this.vertices[j + 1]; 
        }
        this.lines.push(this.vertices[this.vertices.length - 2]);
        this.lines.push(this.vertices[this.vertices.length - 1]);
        this.lines.push(this.vertices[0]);
        this.lines.push(this.vertices[1]);
    }

    public closeCage(): void {
        this.removeLastLine();
        this.addLine(
            this.vertices[this.vertices.length - 2],
            this.vertices[this.vertices.length - 1],
            this.vertices[0],
            this.vertices[1]
        );
        this.drawing = false;

        console.log('Final vertices: ' + this.vertices);
        console.log('Final lines: ' + this.lines);
    }

    public clearOffsets(): void {
        for (let i = 0; i < this.offsets.length; i++) {
            this.offsets[i] = 0;
        }

        this.resetLines();
        this.updatePointShader();
        this.updateLineShader();
    }

    public setHighlighted(index: number): void {
        if (index < 0 || index >= this.vertices.length || index % 2 == 1) {
            this.highlighted = -2;
            return;
        }

        this.highlighted = index;
    }

    public getHighlightedIndex(): number {
        return this.highlighted;
    }

    public getHighlighted(): number[] {
        if (this.highlighted < 0) { return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]; }

        return [
            this.vertices[this.highlighted],
            this.vertices[this.highlighted + 1]
        ];
    }

    public offsetVertex(index: number, mouseX: number, mouseY: number): void {
        let vertexX = this.vertices[index] + this.offsets[index];
        let vertexY = this.vertices[index + 1] + this.offsets[index + 1];

        /* TODO: Probably a much better way to do this than by looping... */
        for (let i = 0; i < this.lines.length; i += 2) {
            if (this.lines[i] == vertexX && this.lines[i + 1] == vertexY) {
                this.lines[i] = this.vertices[index] + (mouseX - this.vertices[index]);
                this.lines[i + 1] = this.vertices[index + 1] + (mouseY - this.vertices[index + 1]);
            }
        }

        this.offsets[index] = mouseX - this.vertices[index];
        this.offsets[index + 1] = mouseY - this.vertices[index + 1];

        this.updatePointShader();
        this.updateLineShader();
    }

    public getHoveredVertex(x: number, y: number): number {
        let closestIndex = 0;
        let closestDistance = Number.MAX_SAFE_INTEGER;

        for (let i = 0; i < this.vertices.length; i += 2) {
            let x2 = this.vertices[i] + this.offsets[i];
            let y2 = this.vertices[i + 1] + this.offsets[i + 1];
            let distance = Math.sqrt((x2 - x)**2 + (y2 - y)**2);
            if (distance < closestDistance) {
                closestIndex = i;
                closestDistance = distance;
            }
        }

        if (closestDistance > 10) {
            return -2;
        }

        return closestIndex;
    }

    private updatePointShader(): void {
        let pShader = this.animation.getPointShader();
        pShader.updateAttributeData('a_position', this.vertices, 2);
        pShader.updateAttributeData('a_offset', this.offsets, 2);
        pShader.setNumDrawElements(this.vertices.length / 2);
    }

    private updateLineShader(): void {
        let lShader = this.animation.getLineShader();
        lShader.updateAttributeData('a_position', this.lines, 2);
        lShader.setNumDrawElements(this.lines.length / 2);
    }

    public getVertices(): number[] { return this.vertices; }
    public getOffsets(): number[] { return this.offsets; }
    public isDrawing(): boolean { return this.drawing; }
}