const FluidSolver = require('./fluid_solver.js');
const MyFluidSolver = require('./my_solver.js');
const MikeAshSolver = require('./mikeash_solver.js');
const Renderer = require('./draw.js');

const SIZE_X = 100;
const SIZE_Y = 100;
const force = 1;
const source = 1000;

var mousePos = [0, 0];
var mouseVel = [0, 0];
var mpos = [2, 2];

const fluid = new Fluid(0.1, .4, 0.0000000000001, SIZE_X);
const solver = new MyFluidSolver(SIZE_X, SIZE_Y, 1);
//const solver = new FluidSolver(SIZE_X, SIZE_Y, 100);
//const solver = new MikeAshSolver(SIZE_X, 0.001, .001, 0.000000001);
//solver.dPrev.ix(50, 50, 1)

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');
const renderer = new Renderer();

// const curr = document.getElementById('curr').getContext('webgl2');
// const prev = document.getElementById('prev').getContext('webgl2');


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

var t = Date.now();

function render() {
  const now = Date.now();
  const delta = now - t;

  //fluid.addDensity(50, 50, 1000000);
  //fluid.addVelocity(50, 50, .1, 0);
  //console.log(fluid.density)
  //fluid.addDensity(mpos[0], mpos[1], 10000000);
  //fluid.addVelocity(mpos[0], mpos[1], 0.52, 0);
  //fluid.step();

  solver.step(delta);
  renderer.draw(delta, solver.density);
  window.requestAnimationFrame(render);
}

init(SIZE_X, SIZE_Y);
render();
