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
    in vec2 a_texcoord;

    uniform vec2 u_resolution;

    out vec2 f_pixel;
    out vec2 f_texcoord;

    
    void main () {
        vec2 clipCoordinates = a_position / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;

        gl_Position = vec4(clipCoordinates, 0.0, 1.0);

        f_texcoord = a_texcoord;
        f_pixel = a_position;
    }
`;

export const easelFSText = `#version 300 es

    precision mediump float;
    in vec2 f_texcoord;
    in vec2 f_pixel;

    uniform float u_num_handles;
    uniform vec2 u_vertices[64];
    uniform vec2 u_offsets[64];
    uniform sampler2D u_texture;

    out vec4 FragColor;


    void main() {
        // Calculate MVC.

        // Add that handle's offset to us.
        // vec2 tex_offset = u_offsets[closestHandle] / 1800.0;
        // vec2 deformedUV = f_texcoord + tex_offset;
        
        // FragColor = texture(u_texture, deformedUV);
        FragColor = texture(u_texture, f_texcoord);
    }
`;
