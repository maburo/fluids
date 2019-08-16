const FluidSolver = require('./fluid_solver.js');
const MyFluidSolver = require('./my_solver.js');
const MikeAshSolver = require('./mikeash_solver.js');
const PSolver = require('./p_solver.js');
const Renderer = require('./draw.js');

const SIZE_X = 100;
const SIZE_Y = 100;
const force = 100000;
const source = 10;

var mousePos = [0, 0];
var mouseVel = [0, 0];
var mpos = [2, 2];

//const fluid = new Fluid(0.1, .4, 0.0000000000001, SIZE_X);
//const solver = new MyFluidSolver(SIZE_X, SIZE_Y, 1);
//const solver = new FluidSolver(SIZE_X, SIZE_Y, 100);
//const solver = new MikeAshSolver(SIZE_X, 0.001, .001, 0.000000001);
const solver = new PSolver(SIZE_X, 0.1, 0, 0.0000001);

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');
const renderer = new Renderer();

function onMouseMove(e) {
  mpos = [
    Math.floor(e.x / (gl.canvas.width / SIZE_X)),
    Math.floor(e.y / (gl.canvas.height / SIZE_Y))
  ];
  mouseVel = [(e.x - mousePos[0]) * force, (e.y - mousePos[1]) * force];

  solver.addDensity(mpos[0], mpos[1], source);
  solver.addVelocity(mpos[0], mpos[1], mouseVel[0], mouseVel[1]);

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
    window.requestAnimationFrame(render);
    // solver.dPrev.fill(0);
    // solver.uPrev.fill(0);
    // solver.vPrev.fill(0);
    // solver.dPrev[SIZE_X * mpos[1] + mpos[0]] = 100;
    //console.log('d:', solver.d, 'prev', solver.dPrev)

    //solver.densStep(0.1);
    break;
  }
});

function init(sx, sy) {
  renderer.init(gl, sx, sy);
}

function render() {
  const now = Date.now();
  const delta = now - t;

  solver.addDensity(50, 50, Math.random() * source);
  solver.addVelocity(50, 50, Math.random() * force, Math.random() * force);
  solver.step(delta);

  renderer.draw(delta, solver.density);
  window.requestAnimationFrame(render);
}

init(SIZE_X, SIZE_Y);
var t = Date.now();
render();
