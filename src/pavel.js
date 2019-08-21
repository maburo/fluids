// https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js

const programs = {};
const ctx = init();
const gl = ctx.gl;

async function loadFile(path) {
  return window.fetch(path).then(resp => resp.text());
}

class GLProgram {
  constructor(vertexShader, fragmentShader) {
    this.uniforms = {};
    this.program = gl.createProgram();

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw gl.getProgramInfoLog(this.program);

    const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < uniformCount; i++) {
      const uniformName = gl.getActiveUniform(this.program, i).name;
      this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
    }
  }

  bind() {
    gl.useProgram(this.program);
  }
}

function compileShader(type, source, keywords = []) {
  source = keywords.reduce((acc, val) => acc += '#define ' + val + '\n', '') + source;

  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw gl.getShaderInfoLog(shader);

  return shader;
}

function init() {
  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false
  };

  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl2');

  //canvas.addEventListener('mousedown', e => console.log(e))
  const mousePrev = {x: 0, y: 0};
  canvas.addEventListener('mousemove', e => {
    if (e.buttons && e.button == 0) {
      const pos = [e.x / canvas.width, 1.0 - e.y / canvas.height];
      const delta = [mousePrev.x - pos[0], mousePrev.y - pos[1]];
      mousePrev.x = pos[0];
      mousePrev.y = pos[1];
      paint(pos, delta);
    }
  });

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.getExtension('EXT_color_buffer_float');

  let formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
  let formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, gl.HALF_FLOAT);
  let formatR = getSupportedFormat(gl, gl.R16F, gl.RED, gl.HALF_FLOAT);

  return {
    gl,
    supportLinearFiltering: gl.getExtension('OES_texture_float_linear'),
    formatRGBA,
    formatRG,
    formatR
  };
}

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
    case gl.R16F:
      return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
    case gl.RG16F:
      return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
    default:
      return null;
    }
  }

  return { internalFormat, format };
}

function supportRenderTextureFormat (gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status == gl.FRAMEBUFFER_COMPLETE;
}

function createFrameBuffer(w, h, internalFormat, format, type, param) {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    attach (id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  };
}

function createDoubleFrameBuffer(w, h, internalFormat, format, type, param) {
  let fbo1 = createFrameBuffer(w, h, internalFormat, format, type, param);
  let fbo2 = createFrameBuffer(w, h, internalFormat, format, type, param);

  const texelSizeX = 1.0 / w;
  const texelSizeY = 1.0 / h;

  return {
    width: w,
    height: h,
    texelSizeX,
    texelSizeY,
    get read() { return fbo1; },
    set read(val) { fbo1 = val; },
    get write() { return fbo2; },
    set write(val) { fbo2 = val; },
    swap() {
      const tmp = fbo1;
      fbo1 = fbo2;
      fbo2 = tmp;
    }
  };
}

let dye;
let velocity;

// https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
function initFrameBuffers() {
  const filtering = ctx.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
  dye = createDoubleFrameBuffer(gl.canvas.width, gl.canvas.height,
                                ctx.formatRGBA.internalFormat,
                                ctx.formatRGBA.format,
                                gl.HALF_FLOAT,
                                filtering);

  velocity = createDoubleFrameBuffer(gl.canvas.width, gl.canvas.height,
                                     ctx.formatRG.internalFormat,
                                     ctx.formatRG.format,
                                     gl.HALF_FLOAT,
                                     filtering);
}



let lastUpdateTime = Date.now();
function calcDeltaTime() {
  let now = Date.now();
  let dt = (now - lastUpdateTime) / 1000;
  dt = Math.min(dt, 0.016666); // ???
  lastUpdateTime = now;
  return dt;
}

function drawDisplay(fbo, width, height) {
  let program = programs.display;
  program.bind();
  gl.uniform1f(program.uniforms.texelSize,
               1.0 / gl.canvas.width, 1.0 / gl.canvas.height);
  gl.uniform1i(program.uniforms.uTexture, dye.read.attach(0));
  blit(fbo);
}

const input = {pos: [], delta: []};
function paint(pos, delta) {
  input.pos = pos;
  input.delta = delta;
}

function applyInput() {
  const prog = programs.splat;
  gl.viewport(0, 0, velocity.width, velocity.height);
  prog.bind();
  gl.uniform1i(prog.uniforms.uTarget, velocity.read.attach(0));
  gl.uniform1f(prog.uniforms.aspectRatio, canvas.width / canvas.height);
  gl.uniform2f(prog.uniforms.point, input.pos[0], input.pos[1]);
  gl.uniform3f(prog.uniforms.color, input.delta[0], input.delta[1], 0.0);
  gl.uniform1f(prog.uniforms.radius, 10);
  blit(velocity.write.fbo);
  velocity.swap();
}

function update() {
  const delta = calcDeltaTime();
  applyInput();
  step(delta);
  render();
  requestAnimationFrame(update);
}

function render() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  drawCheckerboard();
  drawDisplay();
}

const blit = (() => {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  return (dest) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };
})();


function drawCheckerboard(fbo) {
  programs.checkerboard.bind();
  gl.uniform1f(programs.checkerboard.uniforms.aspectRatio, gl.canvas.width / gl.canvas.height);
  blit(fbo);
}

function step(delta) {

}


module.exports = {
  async run() {
    const baseVertexShader = compileShader(gl.VERTEX_SHADER,
                                           await loadFile('/shaders/base_vertex_shader.glsl'));
    const checkerboardShader = compileShader(gl.FRAGMENT_SHADER,
                                             await loadFile('/shaders/checkerboard.glsl'));
    const displayShader = compileShader(gl.FRAGMENT_SHADER,
                                        await loadFile('/shaders/display.glsl'));

    const splatShader = compileShader(gl.FRAGMENT_SHADER,
                                      await loadFile('/shaders/splat.glsl'));

    programs.checkerboard = new GLProgram(baseVertexShader, checkerboardShader);
    programs.display = new GLProgram(baseVertexShader, displayShader);
    programs.splat = new GLProgram(baseVertexShader, splatShader);
    initFrameBuffers();

    update();
  }
};
