function SWAP(a, b) {
  return [b, a];
}

class MikeAshSolver {
  constructor(size, diffusion, viscosity, dt) {
    const N = size;
    this.size = size;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;
    this.diffuseIterations = 4;

    this.s = new Array(N * N).fill(0);
    this.density = new Array(N * N).fill(0);

    this.Vx = new Array(N * N).fill(0);
    this.Vy = new Array(N * N).fill(0);

    this.Vx0 = new Array(N * N).fill(0);
    this.Vy0 = new Array(N * N).fill(0);
  }

  ix(x, y) {
    return y * this.size + x;
  }

  diffuse (b, x, x0, diff, dt) {
    const N = this.size;
    let a = dt * diff * (N - 2) * (N - 2);
    this.lin_solve(b, x, x0, a, 1 + 6 * a, this.diffuseIterations);
    
    //const a = dt * diff * (this.size - 2) * (this.size - 2);
    //this.lin_solve(b, x, x0, a, 1 + 6 * a, this.diffuseIterations, this.size);
  }

  addDensity(x, y, amount) {
    //console.log('addDensity', this)
    const IX = this.ix.bind(this);
    this.density[IX(x, y)] += amount;
  }

  addVelocity(x, y, amountX, amountY) {
    const IX = this.ix.bind(this);
    const i = IX(x, y);
    this.Vx[i] += amountX;
    this.Vy[i] += amountY;
  }

  lin_solve(b, x, x0, a, c, iter) {
    const IX = this.ix.bind(this);
    const N = this.size;
    
    let cRecip = 1.0 / c;
    for (let t = 0; t < iter; t++) {
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                x[IX(i, j)] = (x0[IX(i, j)]
                            + a*(x[IX(i+1, j)] + x[IX(i-1, j)]
                            + x[IX(i, j+1)] + x[IX(i, j-1)])) * cRecip;
            }
        }
        this.set_bnd(b, x);
    }
    

    // let cRecip = 1.0 / c;
    // for (let k = 0; k < this.diffuseIterations; k++) {
    //   for (let j = 1; j < this.size - 1; j++) {
    //     for (let i = 1; i < this.size - 1; i++) {
    //       x[IX(i, j)] =
    //         (x0[IX(i, j)]
    //          + a*(    x[IX(i+1, j)]
    //                   +x[IX(i-1, j)]
    //                   +x[IX(i  , j+1)]
    //                   +x[IX(i  , j-1)]
    //              )) * cRecip;
    //     }
    //   }
    //   this.set_bnd(b, x, this.size);
    // }
  }

  project(velocX, velocY, p, div) {
    const IX = this.ix.bind(this);
    const N = this.size;
    
    for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
            div[IX(i, j)] = -0.5*(velocX[IX(i+1, j)] - velocX[IX(i-1, j)]
            + velocY[IX(i, j+1)] - velocY[IX(i, j-1)])/N;
            p[IX(i, j)] = 0;
        }
    }

    this.set_bnd(0, div); 
    this.set_bnd(0, p);
    this.lin_solve(0, p, div, 1, 6);

    for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
            velocX[IX(i, j)] -= 0.5 * (  p[IX(i+1, j)] - p[IX(i-1, j)]) * N;
            velocY[IX(i, j)] -= 0.5 * (  p[IX(i, j+1)] - p[IX(i, j-1)]) * N;
        }
    }
    
    this.set_bnd(1, velocX);
    this.set_bnd(2, velocY);
    
    // const IX = this.ix.bind(this);

    // for (let j = 1; j < this.size - 1; j++) {
    //   for (let i = 1; i < this.size - 1; i++) {
    //     div[IX(i, j)] = -0.5 *(
    //          velocX[IX(i+1, j  )]
    //         -velocX[IX(i-1, j  )]
    //         +velocY[IX(i  , j+1)]
    //         -velocY[IX(i  , j-1)]
    //     )/this.size;
    //     p[IX(i, j)] = 0;
    //   }
    // }

    // this.set_bnd(0, div, this.size);
    // this.set_bnd(0, p, this.size);
    // this.lin_solve(0, p, div, 1, 6, this.diffuseIterations, this.size);

    //   for (let j = 1; j < this.size - 1; j++) {
    //     for (let i = 1; i < this.size - 1; i++) {
    //       velocX[IX(i, j)] -= 0.5 * (  p[IX(i+1, j)]
    //                                   -p[IX(i-1, j)]) * this.size;
    //       velocY[IX(i, j)] -= 0.5 * (  p[IX(i, j+1)]
    //                                   -p[IX(i, j-1)]) * this.size;
    //     }
    //   }

    // this.set_bnd(1, velocX, this.size);
    // this.set_bnd(2, velocY, this.size);
  }

  advect(b, d, d0, velocX, velocY, dt) {
    const IX = this.ix.bind(this);
    const N = this.size;
    let i0, i1, j0, j1;
  
    let dtx = dt * (N - 2);
    let dty = dt * (N - 2);
  
    let s0, s1, t0, t1;
    let tmp1, tmp2, tmp3, x, y;
  
    let Nfloat = N;
    let ifloat, jfloat;
    let i, j, k;
    

    for (j = 1, jfloat = 1; j < N - 1; j++, jfloat++) { 
        for (i = 1, ifloat = 1; i < N - 1; i++, ifloat++) {
            tmp1 = dtx * velocX[IX(i, j)];
            tmp2 = dty * velocY[IX(i, j)];
            x = ifloat - tmp1; 
            y = jfloat - tmp2;
    
            if (x < 0.5) x = 0.5; 
            if (x > Nfloat + 0.5) x = Nfloat + 0.5; 
            i0 = Math.floor(x); 
            i1 = i0 + 1.0;
            if (y < 0.5) y = 0.5; 
            if (y > Nfloat + 0.5) y = Nfloat + 0.5; 
            j0 = Math.floor(y);
            j1 = j0 + 1.0;
    
            s1 = x - i0; 
            s0 = 1.0 - s1; 
            t1 = y - j0; 
            t0 = 1.0 - t1;
    
            let i0i = parseInt(i0);
            let i1i = parseInt(i1);
            let j0i = parseInt(j0);
            let j1i = parseInt(j1);
    
            d[IX(i, j)] = 
			s0 * (t0 * d0[IX(i0i, j0i)] + t1 * d0[IX(i0i, j1i)]) +
			s1 * (t0 * d0[IX(i1i, j0i)] + t1 * d0[IX(i1i, j1i)]);
        }
    }
  
    this.set_bnd(b, d);
    
    // let i0, i1, j0, j1;

    // let dtx = dt * (this.size - 2);
    // let dty = dt * (this.size - 2);

    // let s0, s1, t0, t1;
    // let tmp1, tmp2, x, y;

    // let Nfloat = this.size;
    // let ifloat, jfloat, kfloat;
    // let i, j;

    // for(j = 1, jfloat = 1; j < this.size - 1; j++, jfloat++) {
    //   for(i = 1, ifloat = 1; i < this.size - 1; i++, ifloat++) {
    //     tmp1 = dtx * velocX[IX(i, j)];
    //     tmp2 = dty * velocY[IX(i, j)];

    //     x    = ifloat - tmp1;
    //     y    = jfloat - tmp2;

    //     if(x < 0.5) x = 0.5;
    //     if(x > Nfloat + 0.5) x = Nfloat + 0.5;
    //     i0 = Math.floor(x);
    //     i1 = i0 + 1.0;
    //     if(y < 0.5) y = 0.5;
    //     if(y > Nfloat + 0.5) y = Nfloat + 0.5;
    //     j0 = Math.floor(y);
    //     j1 = j0 + 1.0;

    //     s1 = x - i0;
    //     s0 = 1.0 - s1;
    //     t1 = y - j0;
    //     t0 = 1.0 - t1;

    //     let i0i = i0|0;
    //     let i1i = i1|0;
    //     let j0i = j0|0;
    //     let j1i = j1|0;

    //     d[IX(i, j)] =
    //       s0 * ( t0 * d0[IX(i0i, j0i)] + t1 * d0[IX(i0i, j1i)]) +
    //       s1 * ( t0 * d0[IX(i1i, j0i)] + t1 * d0[IX(i1i, j1i)]);
    //   }
    // }

    // this.set_bnd(b, d, this.size);
  }

  set_bnd(b, x) {
    const IX = this.ix.bind(this);
    const N = this.size;

    for (let i = 1; i < N - 1; i++) {
		x[IX(i, 0  )] = b == 2 ? -x[IX(i, 1  )] : x[IX(i, 1 )];
		x[IX(i, N-1)] = b == 2 ? -x[IX(i, N-2)] : x[IX(i, N-2)];
		}
	for (let j = 1; j < N - 1; j++) {
		x[IX(0, j)] = b == 1 ? -x[IX(1, j)] : x[IX(1, j)];
		x[IX(N-1, j)] = b == 1 ? -x[IX(N-2, j)] : x[IX(N-2, j)];
	}

	x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
	x[IX(0, N-1)] = 0.5 * (x[IX(1, N-1)] + x[IX(0, N-2)]);
	x[IX(N-1, 0)] = 0.5 * (x[IX(N-2, 0)] + x[IX(N-1, 1)]);
    x[IX(N-1, N-1)] = 0.5 * (x[IX(N-2, N-1)] + x[IX(N-1, N-2)]);
    

    // for(let i = 1; i < N - 1; i++) {
    //   x[IX(i, 0  )] = b == 2 ? -x[IX(i, 1  )] : x[IX(i, 1  )];
    //   x[IX(i, N-1)] = b == 2 ? -x[IX(i, N-2)] : x[IX(i, N-2)];
    // }

    // for(let j = 1; j < N - 1; j++) {
    //   x[IX(0  , j)] = b == 1 ? -x[IX(1  , j)] : x[IX(1  , j)];
    //   x[IX(N-1, j)] = b == 1 ? -x[IX(N-2, j)] : x[IX(N-2, j)];
    // }

    // x[IX(0, 0)]       = 0.5 * (x[IX(1, 0)]     + x[IX(0, 1)]);
    // x[IX(0, N-1)]     = 0.5 * (x[IX(1, N-1)]   + x[IX(0, N-2)]);
    // x[IX(N-1, 0)]     = 0.5 * (x[IX(N-2, 0)]   + x[IX(N-1, 1)]);
    // x[IX(N-1, N-1)]   = 0.5 * (x[IX(N-2, N-1)] + x[IX(N-1, N-2)]);
  }

  step(delta) {
    delta = delta * 0.00000003;
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


    this.diffuse(1, Vx0, Vx, visc, delta);
    this.diffuse(2, Vy0, Vy, visc, delta);
    this.project(Vx0, Vy0, Vx, Vy);
    this.advect(1, Vx, Vx0, Vx0, Vy0, delta);
    this.advect(2, Vy, Vy0, Vx0, Vy0, delta);
    this.project(Vx, Vy, Vx0, Vy0);
    this.diffuse(0, s, density, diff, delta);
    this.advect(0, density, s, Vx, Vy, delta);

    // this.diffuse(1, this.Vx0, this.Vx, this.visc, delta);
    // this.diffuse(2, this.Vy0, this.Vy, this.visc, delta);

    // this.project(this.Vx0, this.Vy0, this.Vx, this.Vy);

    // this.advect(1, this.Vx, this.Vx0, this.Vx0, this.Vy0, delta);
    // this.advect(2, this.Vy, this.Vy0, this.Vx0, this.Vy0, delta);

    // this.project(this.Vx, this.Vy, this.Vx0, this.Vy0);

    // this.diffuse(0, this.s, this.density, this.diff, delta);
    // this.advect(0, this.density, this.s, this.Vx, this.Vy, delta);
  }
}

module.exports = MikeAshSolver;
