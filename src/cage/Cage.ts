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
        // if (this.vertices.length != 0 ) {
            // console.error("ERROR: Reset cage in order to draw new cage.");
            // return;
        // }

        if (this.vertices.length == 0) {
            this.drawing = true;
        }

        if (this.vertices.length > 0) {
            this.addLine(
                this.vertices[this.vertices.length - 2],
                this.vertices[this.vertices.length - 1],
                x,
                y
            );
        }

        
        // Add point.
        this.vertices.push(x);
        this.vertices.push(y);
        this.offsets.push(0);
        this.offsets.push(0);

        let pShader = this.animation.getPointShader();
  
        // Update shaders with new data.
        pShader.updateAttributeData('a_position', this.vertices, 2);
        pShader.updateAttributeData('a_offset', this.offsets, 2);
        pShader.setNumDrawElements(this.vertices.length / 2);
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

        let lShader = this.animation.getLineShader();

        lShader.updateAttributeData('a_position', this.lines, 2);
        lShader.setNumDrawElements(this.lines.length / 2);
    } 

    private removeLastLine(): void {
        this.lines.pop();
        this.lines.pop();
        this.lines.pop();
        this.lines.pop();
    }

    public closeCage(): void {
        this.removeLastLine();
        this.addLine(
            this.vertices[0],
            this.vertices[1],
            this.vertices[this.vertices.length - 2],
            this.vertices[this.vertices.length - 1]
        );
        this.drawing = false;

        console.log('Lines: ' + this.lines.length / 4);
        console.log('Points: ' + this.vertices.length / 2);
    }

    public clearOffsets(): void {
        for (let i = 0; i < this.offsets.length; i++) {
            this.offsets[i] = 0;
        }
        let pShader = this.animation.getPointShader();
        pShader.updateAttributeData('a_offset', this.offsets, 2);
    }

    public cycleHighlighted(step: number): void {
        this.highlighted += 2*step;

        if (this.highlighted >= this.vertices.length) {
            this.highlighted = 0;
        }

        if (this.highlighted < 0) {
            this.highlighted = this.vertices.length - 2;
        }
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

    public offsetActive(x: number, y: number): void {
        this.offsets[this.highlighted] += x;
        this.offsets[this.highlighted + 1] += y;

        let pShader = this.animation.getPointShader();
        // let lShader = this.animation.getLineShader();
        pShader.updateAttributeData('a_offset', this.offsets, 2);
        // lShader.updateAttributeData('a_offset', this.offsets, 2);
    }

    public offsetVertex(index: number, mouseX: number, mouseY: number): void {
        this.offsets[index] = mouseX - this.vertices[index];
        this.offsets[index + 1] = mouseY - this.vertices[index + 1];

        let pShader = this.animation.getPointShader();
        pShader.updateAttributeData('a_offset', this.offsets, 2);
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

    public getVertex(index: number): number[] {
        if (index % 2 != 0) { return []; }
        return [this.vertices[index], this.vertices[index + 1]];
    }

    public getVertices(): number[] { return this.vertices; }
    public getOffsets(): number[] { return this.offsets; }
    public isDrawing(): boolean { return this.drawing; }
}