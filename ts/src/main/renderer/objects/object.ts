import {GL} from '../common';
import Camera from '../camera';
import Renderer from '../render';

export default interface RenderObject {
  init(render:Renderer):void;
  render(gl:GL, camera:Camera, delta:number):void;
}