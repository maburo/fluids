import Render from "./main/renderer/render";
import Camera from "./main/renderer/camera";
import Plane from "./main/renderer/objects/plane";
import { Vector3D, Vector2D } from "./main/math";
import ObjLoader from './main/obj-loader';
import Mesh from './main/renderer/objects/mesh';
import Graph from './main/graph';
import Controller from './main/controller';
import Plane2D from './main/renderer/objects/plane2d';

const camera = new Camera(45, 800/600);
camera.setPosition(0, 0, 20);
camera.rotation = new Vector3D(-90, 0, 0)
const render = new Render(document.body, camera);
const mousePos = new Vector2D();
let plane2d:Plane2D = null;

function loadShader(name:string, vertex:string, fragment:string, attributes:string[], uniforms:string[]) {
  return Promise.all([
    fetch(`shaders/vertex/${vertex}.glsl`).then(r => r.text()),
    fetch(`shaders/fragment/${fragment}.glsl`).then(r => r.text())
  ])
  .then(([vertexSrc, fragmentSrc]) => render.createShader({
      name: fragment,
      vertexSrc,
      fragmentSrc,
      attributes,
      uniforms
    })
  );
}

fetch('textures/checker.jpeg')
.then(r => r.blob())
.then(createImageBitmap)
// const image = new Image();sss
// image.src = 'textures/checker.jpeg';
// image.addEventListener('load', () => {
//   new ImageData(0, 0).data;
//   new ImageBitmap()
  
// });

Promise.all([
  loadShader('textured', 'textured', 'textured',
          ['aVertexPosition', 'aTextureCoords'],
          ["uModelViewMatrix", "uProjectionMatrix"]),
  loadShader('simple', 'simple', 'simple',
          ["aVertexPosition"], 
          ["uModelViewMatrix", "uProjectionMatrix"]),
  loadShader('checker', 'simple', 'checker',
          ['aVertexPosition'],
          ['uModelViewMatrix', 'uProjectionMatrix', 'aspectRatio']),
  loadShader('splat', 'base', 'splat',
          ['aPosition'],
          ['uTarget', 'aspectRatio', 'color', 'point', 'radius']),
  loadShader('curl', 'base', 'curl',
          ['aPosition'],
          ['uVelocity', 'texelSize']),
  loadShader('vorticity', 'base', 'vorticity',
          ['aPosition'],
          ['uVelocity', 'uCurl', 'curl', 'dt']),
  loadShader('divergence', 'base', 'divergence',
          ['aPosition'],
          ['uVelocity']),
  loadShader('clear', 'base', 'clear',
          ['aPosition'],
          ['uTexture', 'value']),
  loadShader('pressure', 'base', 'pressure',
          ['aPosition'],
          ['uPressure', 'uDivergence']),
  loadShader('gradient', 'base', 'gradient',
          ['aPosition'],
          ['uPressure', 'uVelocity']),
  loadShader('advection', 'base', 'advection',
          ['aPosition'],
          ['uVelocity', 'uSource', 'texelSize', 'dyeTexelSize', 'dt', 'dissipation']),
  loadShader('display', 'base', 'display', 
          ['aPosition'],
          ['uTexture',  'uBloom',  'uSunrays',  'uDithering',  'ditherScale',  'texelSize'])
])
.then(shaders => {
  render.run();
  
  // let plane = new Plane(render.getShader('textured'));
  // render.addObject(plane);

  plane2d = new Plane2D();
  render.addObject(plane2d);

  addListeneres();

  // const graph = new Graph(render)
  // render.addObject(graph);

  // new ObjLoader().load('models/teapot.obj')
  // .then(faces => new Mesh(faces, render.getShader('simple')))
  // .then(mesh => render.addObject(mesh))
});

let mousedown = false;

function addListeneres() {
  window.addEventListener('keydown', e => {
    switch (e.code) {
      case 'KeyW':
        camera.velocity.z = 1;
        break;
      case 'KeyS':
        camera.velocity.z = -1;
        break;
      case 'KeyA':
        camera.velocity.x = -1;
        break;
      case 'KeyD':
        camera.velocity.x = 1;
        break;
      case 'KeyQ':
        camera.velocity.y = -1;
        break;
      case 'KeyE':
        camera.velocity.y = 1;
        break;
      case 'KeyO':
        camera.ortho = !camera.ortho;
        break;
    }
  });

  window.addEventListener('keyup', e => {
    switch (e.code) {
      case 'KeyW':
      case 'KeyS':      
        camera.velocity.z = 0;
        break;
      case 'KeyA':
      case 'KeyD':
        camera.velocity.x = 0;
        break;
      case 'KeyQ':
      case 'KeyE':
        camera.velocity.y = 0;
        break;
    }
  });
  
  document.body.addEventListener('mousedown', e => {
    mousePos.x = e.x;
    mousePos.y = e.y;
    mousedown = true;
  });
  
  document.body.addEventListener('mouseup', e => {
    mousedown = false;
  });
  
  document.body.addEventListener('mousemove', e => {
    let p = render.mouseToScreen(e.x, e.y);
    
    plane2d.mousePos.x = p.x;
    plane2d.mousePos.y = p.y;
  
    if (mousedown) {
      // camera.rotate(new Vector3D(mousePos.x - e.x, mousePos.y - e.y));
      const mousesense = .3;
      camera.rotate((e.x - mousePos.x) * mousesense, (e.y - mousePos.y) * -mousesense, 0);
      mousePos.x = e.x;
      mousePos.y = e.y;
    }
    
    // camera.move(new Vector3D(e.x - x, e.y - y, 0));
  });

  document.body.addEventListener('wheel', e => {
    // camera.move(new Vector3D(0, 0, e.deltaY));
  });
}

new Controller().addMouseListener(document.body)
