attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec2 vUv;

void main() {
  vUv = aVertexPosition.xy * 0.5 + 0.5;
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}