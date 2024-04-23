export const pointVSText = `
    precision mediump float;

    attribute vec4 aVertPos;
    
    void main () {
        gl_Position = aVertPos;
    }
`;

export const pointFSText = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
`;

