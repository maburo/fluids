function SWAP(a, b) {
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
    this.N = sx;
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

  idx(x, y) {
    return y * this.N + x;
  }

  add_source ( N, x, s, dt ) {
    const size=(N+2)*(N+2);
    for (let i=0 ; i<size ; i++ ) x[i] += dt*s[i];
  }

  set_bnd (N, b, x ) {
    const IX = this.idx.bind(this);

    for (let i=1 ; i<=N ; i++ ) {
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
    const IX = this.idx.bind(this);
    for ( let k=0 ; k<20 ; k++ ) {
      for (let i=1 ; i<=N ; i++ ) { for (let j=1 ; j<=N ; j++ ) {
      x[IX(i,j)] = (x0[IX(i,j)] + a*(x[IX(i-1,j)]+x[IX(i+1,j)]+x[IX(i,j-1)]+x[IX(i,j+1)]))/c;
      }}
      this.set_bnd ( N, b, x );
    }
  }

  diffuse ( N, b, x, x0, diff, dt ) {
    const a = dt*diff*N*N;
    this.lin_solve ( N, b, x, x0, a, 1+4*a );
  }

  advect ( N, b, d, d0, u, v, dt ) {
    const IX = this.idx.bind(this);
    let i, j, i0, j0, i1, j1;
	let x, y, s0, t0, s1, t1, dt0;

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

  project ( N, u, v, p, div ) {
    const IX = this.idx.bind(this);

    for (let i=1 ; i<=N ; i++ ) { for (let j=1 ; j<=N ; j++ ) {
      div[IX(i,j)] = -0.5*(u[IX(i+1,j)]-u[IX(i-1,j)]+v[IX(i,j+1)]-v[IX(i,j-1)])/N;
      p[IX(i,j)] = 0;
    }}

    this.set_bnd ( N, 0, div );
    this.set_bnd ( N, 0, p );

    this.lin_solve ( N, 0, p, div, 1, 4 );

    for (let i=1 ; i<=N ; i++ ) { for (let j=1 ; j<=N ; j++ ) {
      u[IX(i,j)] -= 0.5*N*(p[IX(i+1,j)]-p[IX(i-1,j)]);
      v[IX(i,j)] -= 0.5*N*(p[IX(i,j+1)]-p[IX(i,j-1)]);
    }}

    this.set_bnd ( N, 1, u );
    this.set_bnd ( N, 2, v );
  }

  densStep(delta) {
    this.dens_step(this.N, this.d, this.dPrev, this.u, this.v, this.diffFactor, delta);
  }

  velStep(delta) {
    this.vel_step(this.N, this.u, this.v, this.uPrev, this.vPrev, this.diffFactor, delta);
  }

  dens_step ( N, x, x0, u, v, diff, dt ) {
    this.add_source ( N, x, x0, dt );
    [x0, x] = SWAP ( x0, x );
    this.diffuse ( N, 0, x, x0, diff, dt );
    [x0, x] = SWAP ( x0, x );
    this.advect ( N, 0, x, x0, u, v, dt );
}

  vel_step ( N, u, v, u0, v0, visc, dt ) {
    this.add_source ( N, u, u0, dt ); this.add_source ( N, v, v0, dt );
    [u0, u] = SWAP ( u0, u ); this.diffuse ( N, 1, u, u0, visc, dt );
    [v0, v] = SWAP ( v0, v ); this.diffuse ( N, 2, v, v0, visc, dt );
    this.project ( N, u, v, u0, v0 );
    [u0, u] = SWAP ( u0, u );
    [v0, v] = SWAP ( v0, v );
    this.advect ( N, 1, u, u0, u0, v0, dt ); this.advect ( N, 2, v, v0, u0, v0, dt );
    this.project ( N, u, v, u0, v0 );
  }
}

module.exports = FluidSolver;
