attribute vec4 aVertexPosition;
attribute vec2 aTextureCoords;
 
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
 
varying vec2 v_texcoord;
 
void main() {
  // Multiply the position by the matrix.
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
 
  // Pass the texcoord to the fragment shader.
  v_texcoord = aTextureCoords;
}