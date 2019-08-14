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

class FluidSolver {
  constructor(sx, sy, diffFactor) {
    this.sx = sx;
    this.sy = sy;
    this.size = sx * sy;
    this.diffFactor = diffFactor;

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

  addSource(target, source, delta) {
    for (var i = 0; i < target.length; i++) {
      target[i] += source[i] * delta;
    }
  }

  diffuse(b, d, dPrev, delta) {
    const a = delta * this.diffFactor * this.size * this.size;

    //console.log(this.sy)
    for (var k = 0; k < 20; k++) {
      for (var y = 0; y < this.sy; y++) {
        for (var x = 0; x < this.sx; x++) {
          const old = dPrev.ix(x, y);
          const newLeft = (x > 0) ?         d.ix(x - 1, y) : 0;
          const newRight = (x < this.sx - 1) ?  d.ix(x + 1, y) : 0;
          const newTop = (y > 0) ?          d.ix(x, y - 1) : 0;
          const newBottom = (y < this.sy - 1) ? d.ix(x, y + 1) : 0;

          var v = (old + a * (newLeft + newRight + newTop + newBottom)) / (1 + 4 * a);
          //console.log('x', x, 'y', y, v);
          if (isNaN(v)) {
            console.log('k', k, 'x', x, 'y', y, 'old', old, 'l', newLeft, 'r', newRight, 't', newTop, 'b', newBottom);
          }

          d.ix(x, y, v);
        }
      }
      //console.log('---')
      //this.setBound(b, this.d);
    }
  }

  advect(b, d, d0, u, v, dt) {

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
    delta = 0.1;
    this.addSource(this.d, this.dPrev, delta);
    //[this.d, this.dPrev] = swap(this.d, this.dPrev);
    this.diffuse(0, this.d, this.dPrev, delta);
    //[this.d, this.dPrev] = swap(this.d, this.dPrev);
  }

  lin_solve() {
  }
}

// d => add forces -> diffuse -> move
// dt = delta

module.exports = FluidSolver;
