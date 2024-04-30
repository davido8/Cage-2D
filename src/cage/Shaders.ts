export const pointVSText = `#version 300 es

    in vec2 a_position;
    in vec2 a_offset;

    uniform vec2 u_resolution;
    uniform vec2 u_highlighted;

    out float highlight;
    
    void main () {

        vec2 clipCoordinates = (a_position + a_offset) / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;
        
        gl_Position = vec4(clipCoordinates, 0.0, 1.0);
        gl_PointSize = 5.0;

        highlight = 0.0;
        float threshold = 0.0001; 
        if (length(a_position - u_highlighted) < threshold) {
            highlight = 1.0;
            gl_PointSize = 10.0;
        }

    }
`;

export const pointFSText = `#version 300 es

    precision mediump float;
    
    in float highlight;

    out vec4 FragColor;

    void main() {
        FragColor = vec4(0.0, 0.0, 1.0, 1.0);

        if (highlight == 1.0) {
            FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    }
`;

export const lineVSText = `#version 300 es

    in vec2 a_position;

    uniform vec2 u_resolution;
    
    void main () {
        vec2 clipCoordinates = (a_position) / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;

        gl_Position = vec4(clipCoordinates, 0.0, 1.0);
    }
`;

export const lineFSText = `#version 300 es

    precision mediump float;

    out vec4 FragColor;

    void main() {
        FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
`;

export const easelVSText = `#version 300 es

    in vec2 a_position;
    in vec2 a_translation;
    in vec4 a_color;

    uniform vec2 u_resolution;
    uniform vec2 u_gridSize;

    out vec4 f_color;
    out vec2 f_uv;

    void main () {
        vec2 clipCoordinates = (a_position + a_translation) / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;

        gl_Position = vec4(clipCoordinates, 0.0, 1.0);

        f_uv = a_translation / u_gridSize;
        f_color = a_color;
    }
`;

export const easelFSText = `#version 300 es

    precision mediump float;

    in vec2 f_uv;
    in vec4 f_color;

    uniform sampler2D u_texture;

    out vec4 FragColor;


    void main() {
        FragColor = f_color;
        FragColor = texture(u_texture, f_uv);
    }
`;
