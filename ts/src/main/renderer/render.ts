import { GL } from './common';
import Shader, { ShaderInput } from "./shader";
import Camera from "./camera";
import RenderObject from './objects/object';
import { Vector2D } from '../math';

type ShaderMap = Record<string, Shader>;

function compileShader(gl:GL, type:number, source:string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compiling shader', gl.getShaderInfoLog(shader), source);
      gl.deleteShader(shader);
      return 0;
  }

  return shader;
}

function initShaderProgram(gl:GL, vsSrc:string, fsSrc:string) {
  const program = gl.createProgram();
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to init shader', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
  }

  return program;
}

function createShader(gl:GL, input:ShaderInput):Shader {
  const program = initShaderProgram(gl, input.vertexSrc, input.fragmentSrc);
  const attr = input.attributes?.reduce((acc:any, name) => {
    return { ...acc, [name]: gl.getAttribLocation(program, name) }
  }, {}) || {};

  const uniform = input.uniforms?.reduce((acc:any, name) => {
    return { ...acc, [name]: gl.getUniformLocation(program, name) }
  }, {}) || {};
  
  return { name: input.name, attr, uniform, bind: () => gl.useProgram(program) };
}

function createFrameBuffer(gl:GL, 
                           width:number, height:number, 
                           internalFormat:number,
                           format:number, 
                           type:number) 
{
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);
}


interface TextureInput {
  width:number;
  height:number;
  level?:number;
  border?:number;
  type:number;
  internalFormat:number;
  format:number;
  filtering?:number;
}

/**
 * Renderer
 */
export default class Render {
  readonly gl:GL;
  private readonly root:HTMLElement;
  private readonly shaders:ShaderMap = {};
  private readonly objects:RenderObject[] = [];
  private prevTime:number = 0;
  private camera:Camera;
  private readonly canvas:HTMLCanvasElement;

  constructor(root:HTMLElement, camera:Camera) {
    this.root = root;
    this.camera = camera;
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.gl = this.canvas.getContext('webgl');
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    root.appendChild(this.canvas);
  }

  render(gl:GL, delta:number) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (this.canvas.width != width || this.canvas.height != height) {
      gl.canvas.width = width;
      gl.canvas.height = height;
      this.camera.setViewportSize(width, height);
      gl.viewport(0, 0, width, height);
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.camera.update(delta);
    this.objects.forEach(obj => obj.render(gl, this.camera, delta));
  }

  createShader(input:ShaderInput):Shader {
    if (!this.shaders[input.name]) {
      this.shaders[input.name] = createShader(this.gl, input);
    }

    return this.shaders[input.name];
  }

  createTexture(input:TextureInput) {
    const gl = this.gl;
    const texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 
                  input.level || 0, 
                  input.internalFormat,
                  input.width,
                  input.height,
                  input.border || 0,
                  input.format,
                  input.type,
                  null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (input.filtering) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, input.filtering);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, input.filtering);
    }

    return texture;
  }

  run() {
    const time = Date.now();
    const delta = Math.min(time - this.prevTime / 1000, 0.016666);
    this.prevTime = time;

    this.render(this.gl, delta);

    requestAnimationFrame(() => this.run());
  }

  async addObject(obj:RenderObject) {
    await obj.init(this);
    this.objects.push(obj);
  }

  getShader(name:string):Shader {
    return this.shaders[name];
  }

  mouseToScreen(x: number, y: number) {
    return new Vector2D(
      x * (1 / this.gl.canvas.width),
      (this.gl.canvas.height - y) * (1 / this.gl.canvas.height));
  }
}