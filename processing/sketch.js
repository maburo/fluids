let fluid;

fluid = new Fluid(0.2, 0, 0.000001);

function setup() {
  createCanvas(300, 300);
  frameRate(30);

}

var sx = 256;
var sy = 256;
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

function init() {
  gl.clearColor(0, 0, 0, 1);
  const vertices = this.vertices = Array(sx * sy * 3 * 6).fill(0);
  const colors = this.colors = Array(sx * sy * 3 * 6).fill(0);

  const hx = 2/sx;
  const hy = 2/sy;

  const cellWidth = 2 / sx;
  const cellHeight = 2 / sy;

  for (var y = 0; y < sy; y++) {
    for (var x = 0; x < sx; x++) {
      const i = (y * sx + x) * 3 * 6;

      const r = {
        x1: x * cellWidth - 1,
        x2: x * cellWidth + cellWidth - 1,
        y1: y * -cellHeight + 1,
        y2: y * -cellHeight - cellHeight + 1
      };

      vertices[i] = r.x1; vertices[i + 1] = r.y1; vertices[i + 2] = 0;
      vertices[i + 3] = r.x1; vertices[i + 4] = r.y2; vertices[i + 5] = 0;
      vertices[i + 6] = r.x2; vertices[i + 7] = r.y2; vertices[i + 8] = 0;
      vertices[i + 9] = r.x1; vertices[i + 10] = r.y1; vertices[i + 11] = 0;
      vertices[i + 12] = r.x2; vertices[i + 13] = r.y2; vertices[i + 14] = 0;
      vertices[i + 15] = r.x2; vertices[i + 16] = r.y1; vertices[i + 17] = 0;
    }
  }

  this.vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  this.cb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const vertCode = `
  precision mediump float;
  attribute vec3 pos;
  attribute vec3 color;
  uniform float size;
  varying vec3 vColor;
  void main(void) {
    gl_Position = vec4(pos, 1.0);
    gl_PointSize = size;
    vColor = color;
  }`;

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertCode);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader', gl.getShaderInfoLog(vs));
    gl.deleteShader(vs);
  }

  const fragCode = `
  precision mediump float;
  varying vec3 vColor;
  void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
  }`;

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragCode);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader', gl.getShaderInfoLog(fs));
    gl.deleteShader(fs);
  }

  this.prog = gl.createProgram();

  gl.attachShader(this.prog, vs);
  gl.attachShader(this.prog, fs);
  gl.linkProgram(this.prog);
  gl.useProgram(this.prog);
}

function draw1() {
  stroke(51);
  strokeWeight(2);

  let cx = int(0.5*width/SCALE);
  let cy = int(0.5*height/SCALE);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      fluid.addDensity(cx+i, cy+j, random(50, 150));
    }
  }

  for (let i = 0; i < 2; i++) {
    let angle = noise(t) * TWO_PI * 2;
    let v = p5.Vector.fromAngle(angle);
    v.mult(0.2);
    t += 0.01;
    fluid.addVelocity(cx, cy, v.x, v.y);
  }

  fluid.step();
  fluid.renderD();
}


function dens2colors(d) {
  for (let i = 0; i < sx; i++) {
    for (let j = 0; j < sy; j++) {
      let d = fluid.density[IX(i, j)];
      const from = (j * 256 + i) * 6 * 3;
      const to = from + 6 * 3;

      for (var k = from; k < to; k++) {
        this.colors[k] = d*.01;
      }
    }
  }

  // for (var i = 0; i < d.length; i++) {
  //   const val = d[i];
  //   const from = i * 6 * 3;
  //   const to = from + 6 * 3;

  //   for (var j = from; j < to; j++) {
  //     this.colors[j] = val;
  //   }
  // }
}

function render() {
  let angle = Math.random() * 3.1415 * 2 * 2;
  let v = p5.Vector.fromAngle(angle);
  v.mult(1.2);
  t += 0.01;
  fluid.addDensity(128, 128, Math.random() * 200 + 50);
  fluid.addVelocity(128, 128, v.x, v.y);
  fluid.step();

  dens2colors(fluid.density);
  // var tmp = Array(sx*sy).fill(0);
  // tmp[0] = 10;
  // tmp[1] = 10;
  // tmp[2] = 10;
  // tmp[3] = 10;
  // dens2colors(tmp);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
  const pos = gl.getAttribLocation(this.prog, 'pos');
  gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(pos);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.cb);
  const color = gl.getAttribLocation(this.prog, 'color');
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(color);

  gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);

  window.requestAnimationFrame(render);
}

init();
render();
