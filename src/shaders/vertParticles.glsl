uniform float time;
uniform float playhead;
varying vec2 vUv;

// const float PI = 3.14159265359;

void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float distance = max(0.001, -mvPosition.z);
    gl_PointSize = 20.0 / distance;

    // gl_PointSize = 10 * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}