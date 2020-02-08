import Camera from '../camera';
import Shader from '../shader';
import { Vector3D } from '../../math'

export default class Mesh {
  pos:Vector3D = new Vector3D();
  shader:Shader
  faces:any;
  vertexCount:number = 0;
  vertexBuffer:WebGLBuffer;
  normalBuffer:WebGLBuffer;

  constructor(faces:any, shader:Shader) {
    this.faces = faces;
    this.shader = shader;
  }

  init(gl:WebGLRenderingContext) {
    const vertexData:number[] = [];
    const normalData:number[] = [];

    var min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    var max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];

    this.faces.forEach((f:any) => {
      f.v.forEach((v:any) => {
        if (v[0] > max[0]) max[0] = v[0];
        if (v[0] < min[0]) min[0] = v[0];

        if (v[1] > max[1]) max[1] = v[1];
        if (v[1] < min[1]) min[1] = v[1];

        if (v[2] > max[2]) max[2] = v[2];
        if (v[2] < min[2]) min[2] = v[2];
      });

      const v1 = f.v[0];
      const v2 = f.v[1];
      const v3 = f.v[2];
      const n1 = f.n[0];
      const n2 = f.n[1];
      const n3 = f.n[2];

      vertexData.push(
        v1[0], v1[1], v1[2],
        v2[0], v2[1], v2[2],
        v3[0], v3[1], v3[2]);

      normalData.push(
        n1[0], n1[1], n1[2],
        n2[0], n2[1], n2[2],
        n3[0], n3[1], n3[2]);
    });

    this.vertexCount = this.faces.length * 3;

    const vb = this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

    const nb = this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  }

  render(gl:WebGLRenderingContext, camera:Camera) {
    this.shader.bind();
    
    gl.uniformMatrix4fv(this.shader.uniform.uProjectionMatrix, 
      false, 
      camera.projectionMtx.data);
    gl.uniformMatrix4fv(this.shader.uniform.uModelViewMatrix, 
      false, 
      camera.viewMtx.data
    );

    // gl.uniform3fv(this.objectColor, [.5, .5, .5]);
    // gl.uniform3fv(this.lightColor, [1, 1, 1 ]);
    // gl.uniform3fv(this.lightPos, [0, 14, 10]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.shader.attr.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.shader.attr.aVertexPosition);

    // gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    // gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(this.shader.attr.);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}