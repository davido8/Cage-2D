export class Cage {
    points: number[];

    constructor() {
        this.points = [];
    }

    public addPoint(screenX: number, screenY: number) {
        this.points.push(screenX);
        this.points.push(screenY);
        this.points.push(1);
    }

    public getPoints(): number[] { return this.points; }
}