class Render {
  constructor() {}

  init(gl, sx, sy) {
    this.gl = gl;

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

  dens2colors(d) {
    for (var i = 0; i < d.length; i++) {
      const val = d[i];
      const from = i * 6 * 3;
      const to = from + 6 * 3;

      for (var j = from; j < to; j++) {
        this.colors[j] = val;
      }
    }
  }

  draw(delta, d) {
    const gl = this.gl;

    this.dens2colors(d);

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
  }
}

module.exports = Render;
