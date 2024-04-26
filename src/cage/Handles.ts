import { CageAnimation } from "./App";

export class Handles {
    private animation: CageAnimation;

    private handles: number[];
    private offsets: number[];

    constructor(cage: CageAnimation) {
        this.handles = [];
        this.offsets = [];
        this.animation = cage;
    }

    public addHandle(x: number, y: number) {
        this.handles.push(x);
        this.handles.push(y);
        this.offsets.push(0);
        this.offsets.push(0);

    }

    public getHandles(): number[] { return this.handles; }
    public getOffsets(): number[] { return this.offsets; }

    public offsetHandle(hid: number, offX: number, offY: number): void {
        hid *= 2;
        this.offsets[hid] += offX;
        this.offsets[hid + 1] += offY;
    }

    public clearOffsets(): void {
        for (let i = 0; i < this.offsets.length; i++) {
            this.offsets[i] = 0;
        }
    }
}