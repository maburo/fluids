const degree = Math.PI / 180;
const EPSILON = 0.000001;

export function toRadian(a:number) {
  return a * degree;
}

export function clamp(value:number, min:number, max:number) {
  if (value > max) return max;
  if (value < min) return min;
  return value;
}

export class Vector2D {
  x:number = 0;
  y:number = 0;

  constructor(x:number = 0, y:number = 0) { this.x = x; this.y = y; }
  copy() { return new Vector2D(this.x, this.y); }
  add(p:Vector2D) { this.x += p.x; this.y += p.y; }
  sub(p:Vector2D) { this.x -= p.x; this.y -= p.y; }
  mul(n:number) { this.x *= n; this.y *= n; }
  div(n:number) { this.x /= n; this.y /= n; }
  set(x:number, y:number) {
    this.x = x;
    this.y = y;
  }

  length() { return Math.sqrt(this.x * this.x + this.y + this.y); }
}

export class Vector3D {
  x:number = 0;
  y:number = 0;
  z:number = 0;

  constructor(x:number = 0, y:number = 0, z:number = 0) { 
    this.x = x; this.y = y; this.z = z; 
  }

  get arr() {
    return [this.x, this.y, this.z]
  }

  static from(arr:number[]) {
    return new Vector3D(arr[0], arr[1], arr[2]);
  }

  copy() { return new Vector3D(this.x, this.y, this.z); }
  add(v:Vector3D) { return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v:Vector3D) { return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(n:number) { return new Vector3D(this.x * n, this.y * n, this.z * n); }
  div(n:number) { return new Vector3D(this.x / n, this.y / n, this.z / n); }

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize():Vector3D {
    const length = this.length;
    return new Vector3D(this.x /= length, this.y /= length, this.z /= length);
  }

  cross(v:Vector3D) {
    return new Vector3D(
      this.y * v.z - this.z * v.y,
      this.x * v.z - this.z * v.x,
      this.x * v.y - this.y * v.x
    );
  }
}

export class Matrix3D {
  readonly data:Array<number>;

  constructor(data:Array<number> = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
    this.data = data;
  }

  mul(m:Matrix3D) {
    const a = this.data;
    const b = m.data;
    let a0 = a[0],  a1 = a[1],  a2 = a[2];
    let a3 = a[3],  a4 = a[4],  a5 = a[5];
    let a6 = a[6],  a7 = a[7],  a8 = a[8];

    let b0 = b[0],  b1 = b[1],  b2 = b[2];
    let b3 = b[3],  b4 = b[4],  b5 = b[5];
    let b6 = b[6],  b7 = b[7],  b8 = b[8];

    a[0] = a0 * b0 + a1 * b3 + a2 * b6;
    a[1] = a0 * b1 + a1 * b4 + a2 * b7;
    a[2] = a0 * b2 + a1 * b5 + a2 * b8;

    a[3] = a3 * b0 + a4 * b3 + a5 * b6;
    a[4] = a3 * b1 + a4 * b4 + a5 * b7;
    a[5] = a3 * b2 + a4 * b5 + a5 * b8;

    a[6] = a6 * b0 + a7 * b3 + a8 * b6;
    a[7] = a6 * b1 + a7 * b4 + a8 * b7;
    a[8] = a6 * b2 + a7 * b5 + a8 * b8;
    
    return this;
  }
}

export class Matrix4D {
  readonly data:Array<number>;

  constructor(data:Array<number> = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
    this.data = data;
  }
  
  mul(m:Matrix4D) {
    const a = this.data;
    const b = m.data;
    let a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
    let a04 = a[4],  a05 = a[5],  a06 = a[6],  a07 = a[7];
    let a08 = a[8],  a09 = a[9],  a10 = a[10], a11 = a[11];
    let a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];

    let b00 = b[0],  b01 = b[1],  b02 = b[2],  b03 = b[3];
    let b04 = b[4],  b05 = b[5],  b06 = b[6],  b07 = b[7];
    let b08 = b[8],  b09 = b[9],  b10 = b[10], b11 = b[11];
    let b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

    a[0] = a00 * b00 + a01 * b04 + a02 * b08 + a03 * b12;
    a[1] = a00 * b01 + a01 * b05 + a02 * b09 + a03 * b13;
    a[2] = a00 * b02 + a01 * b06 + a02 * b10 + a03 * b14;
    a[3] = a00 * b03 + a01 * b07 + a02 * b11 + a03 * b15;

    a[4] = a04 * b00 + a05 * b04 + a06 * b08 + a07 * b12;
    a[5] = a04 * b01 + a05 * b05 + a06 * b09 + a07 * b13;
    a[6] = a04 * b02 + a05 * b06 + a06 * b10 + a07 * b14;
    a[7] = a04 * b03 + a05 * b07 + a06 * b11 + a07 * b15;

    a[8] = a08 * b00 + a09 * b04 + a10 * b08 + a11 * b12;
    a[9] = a08 * b01 + a09 * b05 + a10 * b09 + a11 * b13;
    a[10] = a08 * b02 + a09 * b06 + a10 * b10 + a11 * b14;
    a[11] = a08 * b03 + a09 * b07 + a10 * b11 + a11 * b15;

    a[12] = a12 * b00 + a13 * b04 + a14 * b08 + a15 * b12;
    a[13] = a12 * b01 + a13 * b05 + a14 * b09 + a15 * b13;
    a[14] = a12 * b02 + a13 * b06 + a14 * b10 + a15 * b14;
    a[15] = a12 * b03 + a13 * b07 + a14 * b11 + a15 * b15;
    
    return this;
  }

  clone() {
    return new Matrix4D(this.data.slice());
  }

  static lookAt(eye:Vector3D, center:Vector3D, up:Vector3D) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    let eyex = eye.x;
    let eyey = eye.y;
    let eyez = eye.z;
    let upx = up.x;
    let upy = up.y;
    let upz = up.z;
    let centerx = center.x;
    let centery = center.y;
    let centerz = center.z;

    // if (Math.abs(eyex - centerx) < glMatrix.EPSILON &&
    //     Math.abs(eyey - centery) < glMatrix.EPSILON &&
    //     Math.abs(eyez - centerz) < glMatrix.EPSILON) {
    //   return identity(out);
    // }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.hypot(z0, z1, z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.hypot(x0, x1, x2);
    if (!len) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len;
      x1 *= len;
      x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.hypot(y0, y1, y2);
    if (!len) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len;
      y1 *= len;
      y2 *= len;
    }

    return new Matrix4D([
      x0, y0, z0, 0,
      x1, y1, z1, 0,
      x2, y2, z2, 0,
      -(x0 * eyex + x1 * eyey + x2 * eyez),
      -(y0 * eyex + y1 * eyey + y2 * eyez),
      -(z0 * eyex + z1 * eyey + z2 * eyez),
      1
    ]);
  }

  static perspective(fov:number, aspect:number, near:number, far:number) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Matrix4D([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  static ortho(left:number, right:number, top:number, bottom:number, near:number, far:number) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    var out:number[] = [];
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;

    return new Matrix4D(out);
  }

  transpose() {
    var out:number[] = [];
    if (out === this.data) {
      var a01 = this.data[1],
          a02 = this.data[2],
          a03 = this.data[3];
      var a12 = this.data[6],
          a13 = this.data[7];
      var a23 = this.data[11];
  
      out[1] = this.data[4];
      out[2] = this.data[8];
      out[3] = this.data[12];
      out[4] = a01;
      out[6] = this.data[9];
      out[7] = this.data[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = this.data[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = this.data[0];
      out[1] = this.data[4];
      out[2] = this.data[8];
      out[3] = this.data[12];
      out[4] = this.data[1];
      out[5] = this.data[5];
      out[6] = this.data[9];
      out[7] = this.data[13];
      out[8] = this.data[2];
      out[9] = this.data[6];
      out[10] = this.data[10];
      out[11] = this.data[14];
      out[12] = this.data[3];
      out[13] = this.data[7];
      out[14] = this.data[11];
      out[15] = this.data[15];
    }
  
    return new Matrix4D(out);
  }
}
