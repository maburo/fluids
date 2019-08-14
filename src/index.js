//const Solver2d = require('./2DSolver.js');
const FluidSolver = require('./fluid_solver.js');
const MyFluidSolver = require('./my_solver.js');

const SIZE_X = 100;
const SIZE_Y = 100;

const solver = new MyFluidSolver(SIZE_X, SIZE_Y, 100);
//solver.dPrev.ix(50, 50, 1)

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// const curr = document.getElementById('curr').getContext('webgl2');
// const prev = document.getElementById('prev').getContext('webgl2');

gl.clearColor(0, 0, 0, 1);

const force = 5;
const source = 200;
var mousePos = [0, 0];
var mouseVel = [0, 0];
var mpos = [2, 2];

function clamp(v, min, max) {
  if (v > max) return max;
  else if (v < min) return min;
  return v;
}

function onMouseMove(e) {
  mpos = [
    Math.floor(e.x / (gl.canvas.width / SIZE_X)),
    Math.floor(e.y / (gl.canvas.height / SIZE_Y))
  ];
  mouseVel = [(mousePos[0] - e.x) * force, (mousePos[1] - e.y) * force];

  mousePos = [e.x, e.y];
}

var mode = 1;
canvas.addEventListener('mousemove', onMouseMove);
window.addEventListener('keydown', e => {
  switch (e.key) {
  case '1':
    mode = 1;
    break;
  case '2':
    mode = 2;
    console.log('d', solver.d);
    break;
  case '3':
    mode = 3;
    console.log('prev', solver.dPrev);
    break;
  case 'r':
    //window.requestAnimationFrame(render);
    solver.dPrev.fill(0);
    solver.uPrev.fill(0);
    solver.vPrev.fill(0);
    solver.dPrev[SIZE_X * mpos[1] + mpos[0]] = 100;
    //console.log('d:', solver.d, 'prev', solver.dPrev)

    solver.densStep(0.1);
    break;
  }
});

function dens2colors(d) {
  for (var i = 0; i < solver.size; i++) {
    const val = d[i];
    const from = i * 6 * 3;
    const to = from + 6 * 3;

    for (var j = from; j < to; j++) {
      colors[j] = val;
    }
  }
}


var vb = null;
var cb = null;
var prog = null;
var vertices = [];
var colors = [];

function init(sx, sy) {
  vertices = Array(sx * sy * 3 * 6).fill(0);
  colors = Array(sx * sy * 3 * 6).fill(0);

  const hx = 2/sx;
  const hy = 2/sy;

  const cellWidth = 2 / sx;
  const cellHeight = 2 / sy;

  for (var y = 0; y < sy; y++) {
    for (var x = 0; x < sx; x++) {
      const i = (y * sx + x) * 3 * 6;

      const r = {
        x1: x * cellWidth - 1,
        x2: x * cellWidth + cellWidth - 1,
        y1: y * -cellHeight + 1,
        y2: y * -cellHeight - cellHeight + 1
      };

      vertices[i] = r.x1;
      vertices[i + 1] = r.y1;
      vertices[i + 2] = 0;

      vertices[i + 3] = r.x1;
      vertices[i + 4] = r.y2;
      vertices[i + 5] = 0;

      vertices[i + 6] = r.x2;
      vertices[i + 7] = r.y2;
      vertices[i + 8] = 0;

      vertices[i + 9] = r.x1;
      vertices[i + 10] = r.y1;
      vertices[i + 11] = 0;

      vertices[i + 12] = r.x2;
      vertices[i + 13] = r.y2;
      vertices[i + 14] = 0;

      vertices[i + 15] = r.x2;
      vertices[i + 16] = r.y1;
      vertices[i + 17] = 0;
    }
  }

  vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  cb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const vertCode = `
  precision mediump float;
  attribute vec3 pos;
  attribute vec3 color;
  uniform float size;
  varying vec3 vColor;
  void main(void) {
    gl_Position = vec4(pos, 1.0);
    gl_PointSize = size;
    vColor = color;
  }`;

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertCode);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader', gl.getShaderInfoLog(vs));
    gl.deleteShader(vs);
  }

  const fragCode = `
  precision mediump float;
  varying vec3 vColor;
  void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
  }`;

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragCode);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader', gl.getShaderInfoLog(fs));
    gl.deleteShader(fs);
  }

  prog = gl.createProgram();

  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
}

var t = Date.now();

function render() {
  const now = Date.now();
  const delta = now - t;

  if (mode == 1) {
    solver.dPrev.fill(0);
    solver.uPrev.fill(0);
    solver.vPrev.fill(0);
    solver.dPrev[SIZE_X * mpos[1] + mpos[0]] = source;

    solver.densStep(delta);
    dens2colors(solver.d);
    //solver.dPrev.fill(0);
  } else if (mode == 2) {
    dens2colors(solver.d);
  } else if (mode == 3) {
    dens2colors(solver.dPrev);
  }
  //gl.viewport(0, 0, SIZE_X, SIZE_Y);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  const pos = gl.getAttribLocation(prog, 'pos');
  gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(pos);

  //gl.uniform1f(gl.getUniformLocation(prog, 'size'), size);

  gl.bindBuffer(gl.ARRAY_BUFFER, cb);
  const color = gl.getAttribLocation(prog, 'color');
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(color);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

  window.requestAnimationFrame(render);
}


init(SIZE_X, SIZE_Y);
//init(curr, SIZE_X, SIZE_Y);
//init(curr, SIZE_X, SIZE_Y);
render();
