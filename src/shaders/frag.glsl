uniform float time;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vNoise;

void main() {
    // get normals ->
    vec3 X = dFdx(vPosition);
    vec3 Y = dFdy(vPosition);
    vec3 n = normalize(cross(X, Y));

    gl_FragColor = vec4(n, 1.0);
}
