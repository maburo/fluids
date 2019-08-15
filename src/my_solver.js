function swap(a, b) {
  return [b, a];
}

function clamp(v, min, max) {
  if (v > max) return max;
  else if (v < min) return min;
  return v;
}

function ix(arr, sx) {
  return (x, y, val) => {
    const i = sx * y + x;
    if (val) arr[i] = val;
    return arr[i];
  };
}

// function idx(x, y, n) {
//   return y * n + x;
// }


class FluidSolver {
  constructor(sx, sy, visc) {
    this.sx = sx;
    this.sy = sy;
    this.size = sx * sy;
    this.visc = visc;

    this.v = Array(this.size).fill(0);
    this.v.ix = ix(this.v, sx);

    this.vPrev = Array(this.size).fill(0);
    this.vPrev.ix = ix(this.Prev, sx);

    this.u = Array(this.size).fill(0);
    this.u.ix = ix(this.u, sy);

    this.uPrev = Array(this.size).fill(0);
    this.uPrev.ix = ix(this.uPrev, sy);

    this.d = Array(this.size).fill(0);
    this.d.ix = ix(this.d, sx);

    this.dPrev = Array(this.size).fill(0);
    this.dPrev.ix = ix(this.dPrev, sx);
  }

  idx(x, y) {
    return y * this.sx + x;
  }

  addSource(target, source, delta) {
    for (var i = 0; i < target.length; i++) {
      target[i] += source[i] * delta;
    }
  }

  diffuse(b, x, x0, diff, delta) {
    // console.log('diffuse')
    const a = delta * diff * this.size * this.size;
    this.lin_solve(b, x, x0, a, 1 + 4 * a);
  }

  lin_solve(b, m, x0, a, c) {
    //console.log('lin_solve')
    const IX = this.idx.bind(this);
    for (var k = 0; k < 20; k++) {
      for (var y = 0; y < this.sy; y++) {
        for (var x = 0; x < this.sx; x++) {
          const old = x0[IX(x, y)];
          const newLeft = (x > 0) ?             m[IX(x - 1, y)] : 0;
          const newRight = (x < this.sx - 1) ?  m[IX(x + 1, y)] : 0;
          const newTop = (y > 0) ?              m[IX(x, y - 1)] : 0;
          const newBottom = (y < this.sy - 1) ? m[IX(x, y + 1)] : 0;
          // const newLeft = (x > 0) ?             m.ix(x - 1, y) : 0;
          // const newRight = (x < this.sx - 1) ?  m.ix(x + 1, y) : 0;
          // const newTop = (y > 0) ?              m.ix(x, y - 1) : 0;
          // const newBottom = (y < this.sy - 1) ? m.ix(x, y + 1) : 0;

          var val = (old + a * (newLeft + newRight + newTop + newBottom)) / c;
          m[IX(x, y)] = val;
        }
      }
    }
  }

  advect(b, d, d0, u, v, dt) {
    //console.log('advect', this)
    var dt0 = dt * this.size;
    const N = this.size;
    const IX = this.idx.bind(this);

    for (var j = 0; j < this.sy; j++) {
      for (var i = 0; i < this.sx; i++) {
        var x = i - dt0 * u.ix(i,j);
        var y = j - dt0 * v.ix(i,j);

        if (x < 0.5) x = 0.5;
        if (x > N + 0.5) x = N + 0.5;
        const i0 = x|0;
        const i1 = i0 + 1;

	if (y < 0.5) y = 0.5;
        if (y > N + 0.5) y = N + 0.5;
        const j0 = y | 0;
        const j1 = j0 + 1;

	const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        const val = s0 * (t0 * d0[IX(i0,j0)] +
                        t1 * d0[IX(i0,j1)]) +
	      s1 * (t0 * d0[IX(i1,j0)] +
                    t1 * d0[IX(i1,j1)]);

        d[IX(i, j)] = val;
      }
    }
  }


  setBound(b, x) {
    const N = this.size;
    for (var i = 0; i < this.size; i++) {
      //x.ix(0, i, b == 1 ? -x.ix(1, i) : x.ix(1, i));
      //x.ix(N, i, b == 1 ? -x.ix(N, i) : x.ix(N, i));
      //x.ix(i, 0, b == 2 ? -x.ix(i, 1) : x.ix(i, 1));
      //x.ix(i, N, b == 2 ? -x.ix(i, N) : x.ix(i, N));
    }

    x.ix(0, 0, 0.5 * (x.ix(1, 0) + x.ix(0, 1)));
    x.ix(0, N, 0.5 * (x.ix(1, N) + x.ix(0, N)));
    x.ix(N, 0, 0.5 * (x.ix(N, 0) + x.ix(N, 1)));
    x.ix(N, N, 0.5 * (x.ix(N, N) + x.ix(N, 1)));
  }

  densStep(delta) {
    //delta = 0.1;
    this.addSource(this.d, this.dPrev, delta);
    [this.d, this.dPrev] = swap(this.d, this.dPrev);
    this.diffuse(0, this.d, this.dPrev, delta);
    [this.d, this.dPrev] = swap(this.d, this.dPrev);
    this.advect(0, this.d, this.dPrev, this.u, this.v, delta);
  }

  project(u, v, p, div) {
    const IX = this.idx.bind(this);
    const N = this.size;
    for (let i=1 ; i <= N ; i++) {
      for (let j = 1 ; j <= N ; j++) {
        div[IX(i, j)] = -0.5 * (
            u[IX(i+1,j)] -
            u[IX(i-1,j)] +
            v[IX(i,j+1)] -
            v[IX(i,j-1)]) / N;
	p[IX(i, j)] = 0;
      }
    }

    this.lin_solve(0, p, div, 1, 4);

    for (let i=1 ; i <= N ; i++) {
      for (let j = 1 ; j <= N ; j++) {
        const tmpu = u[IX(i, j)] - 0.5 * N * (p[IX(i+1,j)] - p[IX(i-1,j)]);
        const tmpv = v[IX(i, j)] - 0.5 * N * (p[IX(i,j+1)] - p[IX(i,j-1)]);
        u[IX(i, j)] = tmpu;
        v[IX(i, j)] = tmpv;
      }
    }
  }

  velStep(delta) {
    // console.log('velstep')
    // delta = 0.1;
    var u = this.u;
    var u0 = this.uPrev;
    var v = this.v;
    var v0 = this.vPrev;

    this.addSource(u, u0, delta);
    this.addSource(v, v0, delta);
    [u, u0] = swap(u, u0);
    this.diffuse(1, u, u0, this.visc, delta);
    [v, v0] = swap(v, v0);
    this.diffuse(1, v, v0, this.visc, delta);

    this.advect(1, u, u0, u0, v0, delta);
    this.advect(2, v, v0, u0, v0, delta);
    this.project(u, v, u0, v0);
  }

}

// d => add forces -> diffuse -> move
// dt = delta

module.exports = FluidSolver;
