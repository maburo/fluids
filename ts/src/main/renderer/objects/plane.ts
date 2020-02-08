import Shader from '../shader';
import Camera from '../camera';
import RenderObject from './object';
import { GL } from '../common';
import Renderer from '../render';

export default class Plane implements RenderObject {
  private vtxBuffer:WebGLBuffer;
  private texBuffer:WebGLBuffer;
  private readonly shader:Shader;

  texture:WebGLTexture;

  constructor(shader:Shader) {
    this.shader = shader;
  }

  async init(renderer:Renderer) {
    const gl = renderer.gl;
    this.vtxBuffer = gl.createBuffer();
    const pos = [ -1.0,  1.0, 1.0,  1.0, -1.0, -1.0, 1.0, -1.0 ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vtxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

    // this.texBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
    // const tex = [0, 0, 1, 0, 0, 1, 1, 1];
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex), gl.STATIC_DRAW);

    await this.loadTexture(gl);

    this.texture = gl.createTexture();
  }

  async loadTexture(gl:GL) {
    return fetch('textures/checker.jpeg')
    .then(r => r.blob())
    .then(createImageBitmap)
    .then(image => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.generateMipmap(gl.TEXTURE_2D);
    })
  }

  render(gl:GL, camera:Camera) {
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vtxBuffer);
    gl.vertexAttribPointer(
          this.shader.attr.aVertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
    gl.enableVertexAttribArray(this.shader.attr.aVertexPosition);
    
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
    // gl.vertexAttribPointer(
    //   this.shader.attr.aTextureCoords,
    //   2,
    //   gl.FLOAT,
    //   false,
    //   0,
    //   0
    // );
    // gl.enableVertexAttribArray(this.shader.attr.aTextureCoords);


    this.shader.bind();

    gl.uniform1f(this.shader.uniform.aspectRatio, gl.canvas.width / gl.canvas.height);
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // gl.uniform1i(this.shader.uniform.uTexture, 0);
   
    gl.uniformMatrix4fv(
        this.shader.uniform.uProjectionMatrix,
        false,
        camera.projectionMtx.data);
    gl.uniformMatrix4fv(
        this.shader.uniform.uModelViewMatrix,
        false,
        camera.viewMtx.data);

    {
      const offset = 0;
      const vertexCount = 4;
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
  }
}