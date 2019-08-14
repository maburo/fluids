function IX(x, y, size) {
  return x + y * size;
}

function diffuse(b, x, x0, diff, dt, iter, n) {
  const a = dt * diff * (n - 2) * (n - 2);
  lin_solve(b, x, x0, a, 1 + 6 * a, iter, n);
}

function lin_solve(b, x, x0, a, c, iter, N) {
  const cRecip = 1.0 / c;
  for (let k = 0; k < iter; k++) {
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        x[IX(i, j)] =
          (x0[IX(i, j)]
           + a*(    x[IX(i+1, j, N)]
                    +x[IX(i-1, j, N)]
                    +x[IX(i  , j+1, N)]
                    +x[IX(i  , j-1, N)]
                    +x[IX(i  , j, N)]
                    +x[IX(i  , j, N)]
               )) * cRecip;
      }
    }
    set_bnd(b, x, N);
  }
}

function project(velocX, velocY, p, div, iter, N) {
  for (let k = 1; k < N - 1; k++) {
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        div[IX(i, j, N)] = -0.5 * (
          velocX[IX(i+1, j  , N  )]
            -velocX[IX(i-1, j  , N  )]
            +velocY[IX(i  , j+1, N  )]
            -velocY[IX(i  , j-1, N  )]
        )/N;
        p[IX(i, j, N)] = 0;
      }
    }
  }
  set_bnd(0, div, N);
  set_bnd(0, p, N);
  lin_solve(0, p, div, 1, 6, iter, N);

  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      velocX[IX(i, j, N)] -= 0.5 * (  p[IX(i+1, j, N)]
                                      -p[IX(i-1, j, N)]) * N;
      velocY[IX(i, j, N)] -= 0.5 * (  p[IX(i, j+1, N)]
                                      -p[IX(i, j-1, N)]) * N;
    }
  }

  set_bnd(1, velocX, N);
  set_bnd(2, velocY, N);
}


class Solver2D {
  constructor(dx, dy, dt, diff, visc) {
    this.size = dx * dy;
    this.dt = dt;
    this.diff = diff;
    this.visc = visc;

    this.density = [this.size];
    this.s = [this.size];

    this.vx = [this.size];
    this.vy = [this.size];

    this.vx0 = [this.size];
    this.vy0 = [this.size];
  }

  addDensity(x, y, amount) {
    const index = IX(x, y, this.size);
    this.density[index] = amount;
  }

  addVelocity(x, y, amountX, amountY) {
    const index = IX(x, y, this.size);
    this.vx[index] += amountX;
    this.vy[index] += amountY;
  }
}

module.exports = Solver2D;
