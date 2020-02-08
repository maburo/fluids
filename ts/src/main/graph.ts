import Shader from './renderer/shader';
import Camera from './renderer/camera';
import Render from './renderer/render';

const vs = `
  attribute vec2 aPos;
  uniform mat4 proj;
  uniform float size;

  void main(void) {
    gl_Position = vec4(aPos, 0.0, 1.0);
    gl_PointSize = size;
  }`;

  const fs = `
    precision mediump float;
    uniform vec3 color;

    void main() {
      gl_FragColor = vec4(color.xyz, .01);
    }
  `;

export default class Graph {
  buffer:WebGLBuffer;
  shader:Shader;

  constructor(render:Render) {
    this.shader = render.createShader({
      fragmentSrc: fs,
      vertexSrc: vs,
      name: 'point',
      attributes: ['aPos', 'proj'],
      uniforms: ['color', 'size']
    });
  }

  init(gl:WebGLRenderingContext) {
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const data = [.1, .1, .2, 0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  }

  render(gl:WebGLRenderingContext, camera:Camera) {
    this.shader.bind();
    gl.vertexAttribPointer(this.shader.attr.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.shader.attr.aPos);
    gl.uniformMatrix4fv(this.shader.uniform.proj, false, camera.projectionMtx.data);
    gl.uniform3fv(this.shader.uniform.color, [1, 1, 1]);
    gl.uniform1f(this.shader.uniform.size, 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.drawArrays(gl.POINTS, 0, 2);
  }
}