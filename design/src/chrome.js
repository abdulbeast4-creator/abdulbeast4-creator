// Liquid chrome background, rendered with WebGL.
// Time only enters through sin(t) and cos(t) with t = 2*pi*phase, so the first and last frames match
// and the animation loops seamlessly.
export const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;      // 0..2pi, one loop
uniform float uSeed;
uniform float uAmp;   // how far the surface drifts per loop (it orbits, so the loop stays seamless)

float field(vec2 p, float t) {
  // Iterative sine domain warp with a rotation per step: smooth, liquid, non-repeating blobs.
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 1; i < 7; i++) {
    float fi = float(i);
    p = rot * p;
    p += vec2(
      0.60 / fi * sin(fi * 0.83 * p.y + uAmp * sin(t + 1.3 * fi) + 0.37 * fi + uSeed),
      0.52 / fi * sin(fi * 1.27 * p.x + uAmp * cos(t + 0.7 * fi) + 1.73 * fi)
    );
  }
  return 0.5 + 0.25 * (sin(p.x * 1.3) + sin(p.y * 1.1 + 0.4));
}

vec3 env(vec3 r) {
  // Studio environment: graded grey room, soft-boxes, faint cool and warm bounce (like real chrome).
  float y = r.y;
  float x = r.x;
  vec3 c = mix(vec3(0.05, 0.055, 0.06), vec3(0.62, 0.64, 0.66), smoothstep(-0.9, 0.9, y));
  c += vec3(0.85) * smoothstep(0.16, 0.0, abs(y - 0.50));
  c += vec3(0.60) * smoothstep(0.07, 0.0, abs(y - 0.12));
  c -= vec3(0.40) * smoothstep(0.10, 0.0, abs(y + 0.05));
  c += vec3(0.45) * smoothstep(0.25, 0.0, abs(x + 0.50));
  c += vec3(0.09, 0.15, 0.17) * smoothstep(0.30, 0.0, abs(y + 0.45));
  c += vec3(0.16, 0.10, 0.06) * smoothstep(0.15, 0.0, abs(x - 0.60));
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 4.2;
  float t = uT;
  float e = 0.004;
  float h  = field(p, t);
  float hx = field(p + vec2(e, 0.0), t);
  float hy = field(p + vec2(0.0, e), t);
  vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.1));
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-v, n);
  vec3 col = env(r);
  // Fresnel-ish rim and crease darkening for depth.
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  col = mix(col, vec3(0.92, 0.94, 0.96), fres * 0.35);
  col *= 0.78 + 0.22 * smoothstep(0.15, 0.7, h);
  col = col / (1.0 + 0.18 * col);      // soft highlight roll-off
  gl_FragColor = vec4(pow(col, vec3(0.92)), 1.0);
}
`;
