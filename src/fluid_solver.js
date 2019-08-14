function swap(a, b) {
  return [b, a];
}

function ix(N) {
  return (i, j) => i + (N + 2) * j;;
}

class FluidSolver {
  constructor(sx, sy, diffFactor) {
    this.sx = sx;
    this.sy = sy;
    this.size = (sx + 2) * (sy + 2);
    this.diffFactor = diffFactor;

    this.v = Array(this.size).fill(0);
    this.v.ix = ix(this.v, sx);

    this.u = Array(this.size).fill(0);
    this.u.ix = ix(this.u, sx);

    this.vPrev = Array(this.size).fill(0);
    this.vPrev.ix = (x, y, v) => {
      this.vPrev[this.sx * y + x] = v;
    };

    this.uPrev = Array(this.size).fill(0);
    this.uPrev.ix = (x, y, v) => {
      this.uPrev[this.sy * y + x] = v;
    };

    this.d = Array(this.size).fill(0);
    this.d.ix = ix(this.d, sx);

    this.dPrev = Array(this.size).fill(0);
    this.dPrev.ix = ix(this.dPrev, sx);
  }

  add_source (N, x, s, dt ) {
    var i, size=(N+2)*(N+2);
    for ( i=0 ; i<size ; i++ ) x[i] += dt*s[i];
  }

  set_bnd ( N, b, x ) {
    var i;
    var IX = ix(this.sx);

    for ( i=1 ; i<=N ; i++ ) {
      x[IX(0  ,i)] = b==1 ? -x[IX(1,i)] : x[IX(1,i)];
      x[IX(N+1,i)] = b==1 ? -x[IX(N,i)] : x[IX(N,i)];
      x[IX(i,0  )] = b==2 ? -x[IX(i,1)] : x[IX(i,1)];
      x[IX(i,N+1)] = b==2 ? -x[IX(i,N)] : x[IX(i,N)];
    }
    x[IX(0  ,0  )] = 0.5*(x[IX(1,0  )]+x[IX(0  ,1)]);
    x[IX(0  ,N+1)] = 0.5*(x[IX(1,N+1)]+x[IX(0  ,N)]);
    x[IX(N+1,0  )] = 0.5*(x[IX(N,0  )]+x[IX(N+1,1)]);
    x[IX(N+1,N+1)] = 0.5*(x[IX(N,N+1)]+x[IX(N+1,N)]);
  }

  lin_solve (N, b, x, x0, a, c ) {
    const IX = ix(this.sx);
    var i, j, k;
    for ( k=0 ; k<20 ; k++ ) {
      for ( i=1 ; i<=N ; i++ ) { for ( j=1 ; j<=N ; j++ ) {
        var v = (x0[IX(i,j)] + a*(x[IX(i-1,j)]+x[IX(i+1,j)]+x[IX(i,j-1)]+x[IX(i,j+1)]))/c;
        if (v > 10) v = 1;
        x[IX(i,j)] = v;
        if (isNaN(v)) throw new Error('NaN ' + i + ' ' + j);
      }}
      this.set_bnd ( N, b, x );
    }
  }

  diffuse ( N, b, x, x0, diff, dt ) {
    var a = dt*diff*N*N;
    this.lin_solve ( N, b, x, x0, a, 1+4*a );
  }

  advect ( N, b, d, d0, u, v, dt ) {
    var IX = ix(this.sx);
    var i, j, i0, j0, i1, j1;
    var x, y, s0, t0, s1, t1, dt0;

    dt0 = dt*N;
    for ( i=1 ; i<=N ; i++ ) { for ( j=1 ; j<=N ; j++ ) {
      x = i-dt0*u[IX(i,j)]; y = j-dt0*v[IX(i,j)];
      if (x<0.5) x=0.5; if (x>N+0.5) x=N+0.5; i0=x|0; i1=i0+1;
      if (y<0.5) y=0.5; if (y>N+0.5) y=N+0.5; j0=y|0; j1=j0+1;
      s1 = x-i0; s0 = 1-s1; t1 = y-j0; t0 = 1-t1;
      d[IX(i,j)] = s0*(t0*d0[IX(i0,j0)]+t1*d0[IX(i0,j1)])+
	s1*(t0*d0[IX(i1,j0)]+t1*d0[IX(i1,j1)]);
    }}

    this.set_bnd ( N, b, d );
  }

  dens_step ( N, x, x0, u,  v, diff, dt ) {
    this.add_source ( N, x, x0, dt );
    [x0, x] = swap ( x0, x );
    this.diffuse ( N, 0, x, x0, diff, dt );
    [x0, x] = swap ( x0, x );
    this.advect ( N, 0, x, x0, u, v, dt );
  }

  densStep(delta) {
    this.dens_step(this.sx, this.d, this.dPrev, this.u, this.v, this.diffFactor, delta);
  }
}

module.exports = FluidSolver;
