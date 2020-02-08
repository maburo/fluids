interface EventSource {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

interface InputMap {
  x: Record<string, string>;
}

export default class Controller {
  mouseX:number = 0;
  mouseY:number = 0;
  leftMB:boolean = false;

  addMouseListener(target:EventSource) {
    target.addEventListener('mousedown', (event:MouseEvent) => this.leftMB = true);
    target.addEventListener('mouseup', (event:MouseEvent) => this.leftMB = false);
    target.addEventListener('mousemove', (event:MouseEvent) => {
      this.mouseX = event.x;
      this.mouseY = event.y;
    });
  }

  addWheelEvent(target:EventSource) {
    target.addEventListener('wheel', (e:WheelEvent) => {});
  }

  addKeyListner(target:EventSource) {
    target.addEventListener('keydown', (e:KeyboardEvent) => {
      
    });
    target.addEventListener('keyup', (e:KeyboardEvent) => {
      
    });
  }

  addTouchListner(target:EventSource) {
    target.addEventListener('touchstart', (e:TouchEvent) => {});
    target.addEventListener('touchmove', (e:TouchEvent) => {});
    target.addEventListener('touchcancel', (e:TouchEvent) => {});
    target.addEventListener('touchend', (e:TouchEvent) => {});
  }
}