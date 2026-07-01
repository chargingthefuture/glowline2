// Game orchestration: states (menu / playing / won), the camera, the run timer,
// best-time storage, and the frame loop that ties input, physics, and drawing together.

import { LEVELS } from './levels.js';
import { Level } from './level.js';
import { Ship, SHIP_BOOST_MAX } from './ship.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { Hud } from './hud.js';
import * as audio from './audio.js';

const BEST_KEY = (i) => `glowline2.best.${i}`;

export class Game {
  constructor(canvas) {
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.ship = new Ship();
    this.hud = new Hud({
      onSelectLevel: (i) => this.startLevel(i),
      onNext: () => this.startLevel(Math.min(this.levelIndex + 1, LEVELS.length - 1)),
      onReplay: () => this.startLevel(this.levelIndex),
      onMenu: () => this.toMenu(),
    });

    this.state = 'menu';
    this.level = null;
    this.levelIndex = 0;
    this.time = 0;
    this.best = null;
    this.camera = { x: 0, y: 0 };
    this.showTouch = this.input.usingTouch;
    this._prevBoosting = false;
    this._crashCd = 0; // stops the crash thud from firing every frame of a hit

    // Sound must be unlocked by a user gesture; start() is safe to call repeatedly
    // and also resumes the audio if the browser suspended it.
    const kick = () => audio.start();
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);

    this.toMenu();
    this._last = null;
    requestAnimationFrame((t) => this._frame(t));
  }

  bestTime(i) {
    const raw = localStorage.getItem(BEST_KEY(i));
    return raw != null ? parseFloat(raw) : null;
  }

  toMenu() {
    this.state = 'menu';
    this.level = null;
    const bests = LEVELS.map((_, i) => this.bestTime(i));
    this.hud.showMenu(LEVELS, bests);
  }

  startLevel(i) {
    this.levelIndex = i;
    this.level = new Level(LEVELS[i]);
    this.best = this.bestTime(i);
    this.ship.reset(this.level.start);
    this.camera = { x: this.level.start.x, y: this.level.start.y };
    this.time = 0;
    this.state = 'playing';
    this._prevBoosting = false;
    this._crashCd = 0;
    audio.grind(false);
    this.hud.hideMenu();
    this.hud.hideWin();
  }

  _win() {
    this.state = 'won';
    audio.grind(false);
    audio.finish();
    const prev = this.bestTime(this.levelIndex);
    const isRecord = prev == null || this.time < prev;
    if (isRecord) localStorage.setItem(BEST_KEY(this.levelIndex), this.time.toFixed(3));
    this.best = isRecord ? this.time : prev;
    this.hud.showWin({
      time: this.time,
      best: this.best,
      isRecord,
      hasNext: this.levelIndex < LEVELS.length - 1,
    });
  }

  _respawn() {
    const cp = this.level.lastCheckpoint(this.ship.pos.x);
    this.ship.reset({ x: cp, y: this.level.midYAt(cp), angle: 0 });
    this._prevBoosting = false;
    audio.respawn();
  }

  _update(dt) {
    this.input.poll(); // refresh gamepad state before anything reads it this frame
    this.showTouch = this.input.usingTouch;

    if (this.input.consumeMuteToggle()) {
      audio.toggleMute();
      audio.blip(); // audible only when turning sound back on
    }

    if (this.input.consumeRestart() && this.level) {
      this.startLevel(this.levelIndex);
      return;
    }

    // Gamepad drives the DOM overlays when we are not in a level. Consume the
    // one-shots every frame so a press during play never carries over to a menu.
    const nav = this.input.consumeNav();
    const confirm = this.input.consumeConfirm();
    if (this.state === 'menu' || this.state === 'won') {
      if (nav) this.hud.moveFocus(nav);
      if (confirm) this.hud.activateFocus();
    }

    if (this.state !== 'playing') {
      audio.grind(false); // no wall hiss on the menu or win screen
      return;
    }

    this.ship.update(dt, this.input.sample(), this.level);
    this.time += dt;

    // Sound tied to what the ship is doing this frame.
    audio.grind(this.ship.grinding, Math.min(1, this.ship.speed / SHIP_BOOST_MAX));
    if (this.ship.boosting && !this._prevBoosting) audio.boost();
    this._prevBoosting = this.ship.boosting;
    this._crashCd -= dt;
    if (this.ship.impact > 0.6 && this._crashCd <= 0) {
      audio.crash(this.ship.impact);
      this._crashCd = 0.25;
    }

    // Fell out of the maze -> back to the last checkpoint.
    const b = this.level.bounds;
    const p = this.ship.pos;
    if (p.y < b.top || p.y > b.bottom || p.x < b.left) this._respawn();

    // Crossed the finish gate.
    if (p.x >= this.level.finishX) this._win();

    // Camera follows with a little look-ahead in the travel direction.
    const targetX = p.x + this.ship.vel.x * 0.35 + 120;
    const targetY = p.y + this.ship.vel.y * 0.2;
    const k = Math.min(1, 6 * dt);
    this.camera.x += (targetX - this.camera.x) * k;
    this.camera.y += (targetY - this.camera.y) * k;
  }

  _frame(t) {
    if (this._last == null) this._last = t;
    let dt = (t - this._last) / 1000;
    this._last = t;
    if (dt > 0.05) dt = 0.05; // clamp after a tab switch or a slow frame

    this._update(dt);
    const layout = this.renderer.draw(this);
    this.input.setButtons(layout);

    requestAnimationFrame((nt) => this._frame(nt));
  }
}
