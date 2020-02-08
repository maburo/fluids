let N = 100;
let iter = 16;
let t = 0;

// function to use 1D array and fake the extra two dimensions --> 3D
function IX(x, y) {
  return x + y*N;
}

// Fluid cube class
class Fluid {
  constructor(dt, diffusion, viscosity, sx) {
    N = sx;
    this.size = N;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;

    this.s = new Array(N*N).fill(0);
    this.density = new Array(N*N).fill(0);

    this.Vx = new Array(N*N).fill(0);
    this.Vy = new Array(N*N).fill(0);

    this.Vx0 = new Array(N*N).fill(0);
    this.Vy0 = new Array(N*N).fill(0);
  }

  // step method
  step() {
    //console.log(this.density.length)
    let N = this.size;
    let visc = this.visc;
    let diff = this.diff;
    let dt = this.dt;
    let Vx = this.Vx;
    let Vy = this.Vy;
    let Vx0 = this.Vx0;
    let Vy0  = this.Vy0;
    let s = this.s;
    let density = this.density;


    diffuse(1, Vx0, Vx, visc, dt);
    diffuse(2, Vy0, Vy, visc, dt);

    project(Vx0, Vy0, Vx, Vy);

    advect(1, Vx, Vx0, Vx0, Vy0, dt);
    advect(2, Vy, Vy0, Vx0, Vy0, dt);

    project(Vx, Vy, Vx0, Vy0);
    diffuse(0, s, density, diff, dt);
    advect(0, density, s, Vx, Vy, dt);
  }

  // method to add density
  addDensity(x, y, amount) {
    let index = IX(x, y);
    //console.log(this.density.length, index, x, y)
    this.density[index] += amount;
  }

  // method to add velocity
  addVelocity(x, y, amountX, amountY) {
    let index = IX(x, y);
    this.Vx[index] += amountX;
    this.Vy[index] += amountY;
  }
}
