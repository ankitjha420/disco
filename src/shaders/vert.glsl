uniform float time;
uniform float playhead;
varying vec2 vUv;
varying vec3 vNormal;
varying float vNoise;
varying vec3 vPosition;

float PI = 3.1451926535;
float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float noised(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

void main() {
    vUv = uv;
    vNormal = normal;

    vec3 p = position;
    float noise = noised(
        vec3(p.x, p.y + 0.2 * cos(2.0 * PI * playhead), p.z + 0.2 * sin(2.0 * PI * playhead)) * 8.0
    );
    noise = noise * (2.0 - noise);
    vNoise = noise;

    vPosition = position;
    vec3 newPosition = position + noise * 0.5 * normalize(position);
    vec4 vView = modelViewMatrix * vec4(newPosition, 1.0);
    vPosition = vView.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_PointSize = 20.0 * (1.0 / -mvPosition.z);

    gl_Position = projectionMatrix * vView;
}
