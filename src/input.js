// Player input: keyboard and touch. The game reads a steer/boost sample each frame
// and asks whether a one-shot action (restart) fired. On-screen touch buttons are
// laid out by the game (so they match what gets drawn); this module only hit-tests
// pointers against those rectangles.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointers = new Map(); // pointerId -> {x, y}
    this.buttons = { left: null, right: null, boost: null, restart: null };
    this.usingTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this._restart = false;

    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));

    canvas.addEventListener('pointerdown', (e) => this._onPointer(e, true));
    canvas.addEventListener('pointermove', (e) => this._onPointer(e, null));
    canvas.addEventListener('pointerup', (e) => this._onPointer(e, false));
    canvas.addEventListener('pointercancel', (e) => this._onPointer(e, false));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _onKey(e, down) {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 'r'].includes(k)) {
      e.preventDefault();
    }
    if (down && k === 'r') this._restart = true;
    if (down) this.keys.add(k);
    else this.keys.delete(k);
  }

  _onPointer(e, down) {
    e.preventDefault();
    this.usingTouch = this.usingTouch || e.pointerType === 'touch';
    const r = this.canvas.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (down === true) {
      this.pointers.set(e.pointerId, pt);
      if (this._hit(this.buttons.restart, pt)) this._restart = true;
    } else if (down === false) {
      this.pointers.delete(e.pointerId);
    } else if (this.pointers.has(e.pointerId)) {
      this.pointers.set(e.pointerId, pt);
    }
  }

  _hit(rect, pt) {
    return rect && pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
  }

  _anyPointerIn(rect) {
    if (!rect) return false;
    for (const pt of this.pointers.values()) if (this._hit(rect, pt)) return true;
    return false;
  }

  // Rectangles for the on-screen buttons, in CSS pixels, supplied by the game each frame.
  setButtons(buttons) {
    this.buttons = buttons;
  }

  // Returns { steer: -1..1, boost: bool }.
  sample() {
    let steer = 0;
    const k = this.keys;
    if (k.has('arrowleft') || k.has('a')) steer -= 1;
    if (k.has('arrowright') || k.has('d')) steer += 1;
    if (this._anyPointerIn(this.buttons.left)) steer -= 1;
    if (this._anyPointerIn(this.buttons.right)) steer += 1;

    let boost = k.has(' ') || k.has('arrowup') || k.has('w');
    if (this._anyPointerIn(this.buttons.boost)) boost = true;

    return { steer: Math.max(-1, Math.min(1, steer)), boost };
  }

  consumeRestart() {
    const r = this._restart;
    this._restart = false;
    return r;
  }
}
