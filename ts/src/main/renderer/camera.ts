import { Vector3D, toRadian, Matrix4D, Matrix3D } from "../math";

export default class Camera {
  fov = 0;
  aspect = 0;
  width = 0;
  height = 0;
  pos = new Vector3D(0, 0, 0);
  dir = new Vector3D(0, 0, 0);
  up = new Vector3D(0, 1, 0);
  rot = [0, 0, 0];
  velocity = new Vector3D();
  movespeed = .005;
  zNear = 0.1;
  zFar = 100.0;
  mView = new Matrix4D();
  mPerspective = new Matrix4D();
  ortho:boolean = false;

  private viewDirty = true;
  private projDirty = true;
  

  constructor(fov:number, aspect:number) {
    this.fov = fov * Math.PI / 180;
    this.aspect = aspect;
    this.rot = [0, 0, 0];
  }

  setPosition(x:number, y:number, z:number) {
    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;
    this.viewDirty = true;
  }

  set rotation(v:Vector3D) {
    this.rot[0] = v.x;
    this.rot[1] = v.y;
    this.rot[2] = v.z;

    const rx = toRadian(this.rot[0]);
    const ry = toRadian(this.rot[1]);
    const rz = toRadian(this.rot[2]);

    const cosY = Math.cos(ry);
    const vx = cosY * Math.cos(rx);
    const vy = Math.sin(ry);
    const vz = cosY * Math.sin(rx);
    this.dir = new Vector3D(vx, vy, vz).normalize();
    this.viewDirty = true;
  }

  get rotation() {
    return new Vector3D(this.rot[0], this.rot[1], this.rot[2]);
  }

  rotate(x:number, y:number, z:number) {
    this.rot[0] += x;
    this.rot[1] += y;
    this.rot[2] += z;

    const rx = toRadian(this.rot[0]);
    const ry = toRadian(this.rot[1]);
    const rz = toRadian(this.rot[2]);

    const cosY = Math.cos(ry);
    const vx = cosY * Math.cos(rx);
    const vy = Math.sin(ry);
    const vz = cosY * Math.sin(rx);
    this.dir = new Vector3D(vx, vy, vz).normalize();
    this.viewDirty = true;
  }

  setRotation(x:number, y:number, z:number) {
    this.rot = [x, y, z];
    this.viewDirty = true;
  }

  get projectionMtx() {
    if (this.projDirty) {
      if (this.ortho) {
        const hw = this.width / 50;
        const hh = this.height / 50;
        this.mPerspective = Matrix4D.ortho(-hw, hw, hh, -hh, this.zNear, this.zFar);
      } else {
        this.mPerspective = Matrix4D.perspective(this.fov, this.aspect, this.zNear, this.zFar);
      }
    }

    return this.mPerspective;
  }

  get viewMtx():Matrix4D {
    if (this.viewDirty) {
      this.mView = Matrix4D.lookAt(this.pos, this.pos.add(this.dir), this.up)
    }
    
    return this.mView;
  }

  setViewportSize(width:number, height:number):void {
    this.width = width;
    this.height = height;
    this.aspect = width / height;
  }
  
  update(delta:number) {
    const speed = delta * this.movespeed;

    if (this.velocity.x) {
      const z = this.dir.cross(this.up).normalize().mul(speed * this.velocity.x)
      this.pos = this.pos.add(z);
      this.viewDirty = true;
    }

    if (this.velocity.y) {
      this.pos = this.pos.add(this.up.mul(speed * this.velocity.y))
      this.viewDirty = true;
    }

    if (this.velocity.z) {
      this.pos = this.pos.add(this.dir.mul(speed * this.velocity.z));
      this.viewDirty = true;
    }
  }
}