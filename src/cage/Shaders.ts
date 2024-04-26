export const pointVSText = `#version 300 es

    in vec2 a_position;
    in vec2 a_offset;

    uniform vec2 u_resolution;
    
    void main () {

        vec2 clipCoordinates = (a_position + a_offset) / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;

        gl_Position = vec4(clipCoordinates, 0.0, 1.0);
        gl_PointSize = 5.0;
    }
`;

export const pointFSText = `#version 300 es

    precision mediump float;

    out vec4 FragColor;

    void main() {
        FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
`;

export const lineVSText = `#version 300 es

    in vec2 a_position;

    uniform vec2 u_resolution;
    
    void main () {
        vec2 clipCoordinates = a_position / u_resolution;
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
    uniform vec2 u_handles[64];
    uniform vec2 u_offsets[64];
    uniform sampler2D u_texture;

    out vec4 FragColor;

    float euc_distance(vec2 pixel, vec2 handle) {
        return sqrt(dot(pixel - handle, pixel - handle));
    }

    void main() {
        // Find out which handle we're closest to.
        float found = 0.0;
        int closestHandle = -1;
        float closestDistance = 1.0E20;
        int num_handles = int(u_num_handles);
        for (int i = 0; i < num_handles; i++) {
            float d = euc_distance(f_pixel, u_handles[i]);
            if (d < closestDistance) {
                closestHandle = i;
                closestDistance = d;
                found = 1.0;
            }
        }

        // Add that handle's offset to us.
        vec2 tex_offset = u_offsets[closestHandle] / 1800.0;
        vec2 deformedUV = f_texcoord + tex_offset;
        
        FragColor = texture(u_texture, deformedUV);
        // FragColor = vec4(float(closestHandle) / u_num_handles, 0.0, found, 1.0);
    }
`;
