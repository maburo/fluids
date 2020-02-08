import Shader from '../shader';
import Camera from '../camera';
import RenderObject from './object';
import { GL } from '../common';
import { Matrix4D, Vector2D } from '../../math';
import Renderer from '../render';
import { create } from 'domain';

interface FrameBuffer {
  fbo:WebGLFramebuffer;
  texelSizeX:number;
  texelSizeY:number;
  attach(id:number):number;
}

interface DoubleBuffer {
  width:number;
  height:number;
  fbo1:FrameBuffer;
  fbo2:FrameBuffer;
  texelSizeX:number;
  texelSizeY:number;
  swap():void;
  read():FrameBuffer;
  write():FrameBuffer;
}

function createFramebuffer(render:Renderer, width:number, height:number):FrameBuffer {
  const gl = render.gl;

  const ext = gl.getExtension('OES_texture_half_float');
  const supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
  const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST
  const texelSizeX = 1.0 / width;
  const texelSizeY = 1.0 / height;
  
  // const texture = render.createTexture({
  //   width,
  //   height,
  //   format: gl.RGBA,
  //   internalFormat: gl.RGBA,
  //   type: ext.HALF_FLOAT_OES,
  //   filtering
  // });

  // const fbo = gl.createFramebuffer();
  // gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  // gl.viewport(0, 0, width, height);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.activeTexture(gl.TEXTURE0);
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

  let fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);


  return {
    fbo,
    texelSizeX,
    texelSizeY,
    attach: (id:number) => {
      // console.log('attach', id, texture);
      
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  }
}

function createDoubleFramebuffer(render:Renderer, width:number, height:number):DoubleBuffer {
  let fbo1:FrameBuffer = createFramebuffer(render, width, height);
  let fbo2:FrameBuffer = createFramebuffer(render, width, height);
  const texelSizeX = 1.0 / width;
  const texelSizeY = 1.0 / height;

  return {
    width,
    height,
    texelSizeX,
    texelSizeY,
    fbo1, 
    fbo2,
    swap: () => {
      const tmp = fbo1;
      fbo1 = fbo2;
      fbo2 = tmp;
    },
    read:() => fbo1,
    write:() => fbo2
  }
}


/**
 * Plane2D
 */
export default class Plane2D implements RenderObject {
  private vtxBuffer:WebGLBuffer;
  private splat:Shader;
  private curlShader:Shader;
  private vorticityShader:Shader;
  private advection:Shader;
  private displayShader:Shader;
  private divergenceShader:Shader;
  private clear:Shader;

  readonly mousePos = new Vector2D();  

  // texture:WebGLTexture;
  // fbo:WebGLFramebuffer;
  
  curl:FrameBuffer;
  divergence:FrameBuffer;
  dye:DoubleBuffer;
  velocity:DoubleBuffer;
  pressure:DoubleBuffer;
  

  async init(render:Renderer) {
    const gl = render.gl;

    this.splat = render.getShader('splat');
    this.curlShader = render.getShader('curl');
    this.advection = render.getShader('advection');
    this.displayShader = render.getShader('display');
    this.vorticityShader = render.getShader('vorticity');
    this.divergenceShader = render.getShader('divergence');
    this.clear = render.getShader('clear');

    this.dye = createDoubleFramebuffer(render, 1024, 1024);
    this.velocity = createDoubleFramebuffer(render, 128, 128);
    this.curl = createFramebuffer(render, 128, 128);
    this.divergence = createFramebuffer(render, 128, 128);
    this.pressure = createDoubleFramebuffer(render, 128, 128);

    this.vtxBuffer = gl.createBuffer();
    const pos = [ -1.0,  1.0, 1.0,  1.0, -1.0, -1.0, 1.0, -1.0 ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vtxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);    
  }

  blit(gl:WebGLRenderingContext, fb?:WebGLFramebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }


  render(gl:GL, camera:Camera, delta:number) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vtxBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    
    const w = gl.canvas.width;
    const h = gl.canvas.height;

    // splat
    gl.viewport(0, 0, this.velocity.width, this.velocity.height);
    this.splat.bind();
    let uniform = this.splat.uniform;
    gl.uniform1i(uniform.uTarget, this.velocity.read().attach(0));
    gl.uniform1f(uniform.aspectRatio, w / h);
    gl.uniform2f(uniform.point, this.mousePos.x, this.mousePos.y);
    gl.uniform3f(uniform.color, 1, 0, 0);
    gl.uniform1f(uniform.radius, .001);
    this.blit(gl, this.velocity.write().fbo);
    this.velocity.swap();

    gl.viewport(0, 0, this.dye.width, this.dye.height);
    gl.uniform1i(uniform.uTarget, this.dye.read().attach(0));
    gl.uniform3f(uniform.color, 1, 0, 0);
    this.blit(gl, this.dye.write().fbo);
    this.dye.swap();

    // step
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, this.velocity.width, this.velocity.height);

    this.curlShader.bind();
    gl.uniform2f(this.curlShader.uniform.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    gl.uniform1i(this.curlShader.uniform.uVelocity, this.velocity.read().attach(0));
    this.blit(gl, this.curl.fbo);


    this.vorticityShader.bind();
    gl.uniform2f(this.vorticityShader.uniform.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    gl.uniform1i(this.vorticityShader.uniform.uVelocity, this.velocity.read().attach(0));
    gl.uniform1i(this.vorticityShader.uniform.uCurl, this.curl.attach(1));
    gl.uniform1f(this.vorticityShader.uniform.curl, 30);
    gl.uniform1f(this.vorticityShader.uniform.dt, delta);
    this.blit(gl, this.velocity.write().fbo)
    this.velocity.swap();

    this.vorticityShader.bind();
    gl.uniform2f(this.vorticityShader.uniform.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    gl.uniform1i(this.vorticityShader.uniform.uVelocity, this.velocity.read().attach(0));
    gl.uniform1i(this.vorticityShader.uniform.uCurl, this.curl.attach(1));
    gl.uniform1f(this.vorticityShader.uniform.curl, 30);
    gl.uniform1f(this.vorticityShader.uniform.dt, delta);
    this.blit(gl, this.velocity.write().fbo);
    this.velocity.swap();

    this.divergenceShader.bind();
    gl.uniform2f(this.divergenceShader.uniform.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    gl.uniform1i(this.divergenceShader.uniform.uVelocity, this.velocity.read().attach(0));
    this.blit(gl, this.divergence.fbo);

    this.clear.bind();
    gl.uniform1i(this.clear.uniform.uTexture, this.pressure.read().attach(0));
    gl.uniform1f(this.clear.uniform.value, 0.8);
    this.blit(gl, this.pressure.write().fbo);
    this.pressure.swap();


    this.advection.bind();
    gl.uniform2f(this.advection.uniform.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    gl.uniform2f(this.advection.uniform.dyeTexelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    const velocityId = this.velocity.read().attach(0);
    gl.uniform1i(this.advection.uniform.uVelocity, velocityId);
    gl.uniform1i(this.advection.uniform.uSource, velocityId);
    gl.uniform1f(this.advection.uniform.dt, delta);
    gl.uniform1f(this.advection.uniform.dissipation, 0.2);
    this.blit(gl, this.velocity.write().fbo);
    this.velocity.swap();

    gl.viewport(0, 0, this.dye.width, this.dye.height);
    gl.uniform2f(this.advection.uniform.dyeTexelSize, this.dye.texelSizeX, this.dye.texelSizeY);
    gl.uniform1i(this.advection.uniform.uVelocity, this.velocity.read().attach(0));
    gl.uniform1i(this.advection.uniform.uSource, this.dye.read().attach(1));
    gl.uniform1f(this.advection.uniform.dissipation, 1);
    this.blit(gl, this.dye.write().fbo);
    this.dye.swap();

    
    // render
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    gl.viewport(0, 0, w, h);
    this.displayShader.bind();
    uniform = this.displayShader.uniform;
    gl.uniform2f(uniform.texelSize, 1.0 / w, 1.0 / h);
    gl.uniform1i(uniform.uTexture, this.dye.read().attach(0));
    this.blit(gl, null);
  }
}