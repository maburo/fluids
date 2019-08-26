precision highp float;
precision highp sampler2D;

varying vec2 vUv;

uniform sampler2D uTarget;
uniform float aspecRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

void main() {
  vec2 p = vUv - point.xy;
  p.x *= aspecRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
  gl_FragColor = vec4(splat, 1.0);
}
