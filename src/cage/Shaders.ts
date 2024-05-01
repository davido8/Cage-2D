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

    uniform float u_numCageVertices;
    uniform vec2 u_vertices[64];
    uniform vec2 u_offsets[64];

    uniform float u_cageGenerated;

    uniform sampler2D u_mvc;

    out vec2 f_uv;

    float W(vec2 p0, int i) {
        int numVertices = int(u_numCageVertices);

        // Get all the points we need.
        int minus = i - 1;
        if (minus < 0) {
            minus = numVertices - 1;
        }
        vec2 pi = u_vertices[i];
        vec2 pi_plusone = u_vertices[(i + 1) % numVertices];
        vec2 pi_minusone = u_vertices[minus];

        // Get all vectors we need.
        vec2 p0_pi = normalize(pi - p0);
        vec2 p0_piplusone = normalize(pi_plusone - p0);
        vec2 p0_piminusone = normalize(pi_minusone - p0);

        // Get the angles.
        float alphai = acos(clamp(dot(p0_pi, p0_piplusone), -1.0, 1.0));
        float alphaj = acos(clamp(dot(p0_piminusone, p0_pi), -1.0, 1.0));

        float w = tan(alphaj / 2.0) + tan(alphai / 2.0);
        return w / length(pi - p0);
    }

    float lambda(vec2 v0, int target) {
        float numerator = 0.0;

        float cumsum = 0.0;
        int numVertices = int(u_numCageVertices);
        for (int i = 0; i < numVertices; i++) {
            float w = W(v0, i);
            if (i == target) {
                numerator = w;
            }

            cumsum += w;
        }

        return numerator / cumsum;
    }

    void main () {
        vec2 gridVertex = a_position + a_translation;

        vec2 clipCoordinates = gridVertex / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;

        gl_Position = vec4(clipCoordinates, 0.0, 1.0);

        int deform = int(u_cageGenerated);
        if (deform == 0) {
            f_uv = a_translation / u_gridSize;
            return;
        }

        vec2 undeformedPos = vec2(0.0, 0.0);
        vec2 deformedPos = vec2(0.0, 0.0);

        int numVertices = int(u_numCageVertices);
        for (int i = 0; i < numVertices; i++) {
            // float weight = texture(u_mvc, mvc_coord).r;
            float weight = lambda(gridVertex, i);

            undeformedPos += weight * (u_vertices[i]);
            deformedPos += weight * (u_vertices[i] + u_offsets[i]);
        }

        f_uv = (a_translation + (undeformedPos - deformedPos)) / u_gridSize;

        clipCoordinates = deformedPos / u_resolution;
        clipCoordinates *= 2.0;
        clipCoordinates -= 1.0;
        clipCoordinates.y *= -1.0;

        gl_Position = vec4(clipCoordinates, 0.0, 1.0);
        f_uv = a_translation / u_gridSize;
    }
`;

export const easelFSText = `#version 300 es

    precision mediump float;

    in vec2 f_uv;

    uniform sampler2D u_texture;

    out vec4 FragColor;


    void main() {
        FragColor = vec4(f_uv, 0.0, 1.0);
        FragColor = texture(u_texture, f_uv);
    }
`;
