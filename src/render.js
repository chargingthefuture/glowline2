// All canvas drawing: the neon maze, the ship and its trail, the in-game HUD, and
// the on-screen touch buttons. Everything is drawn in CSS pixels (the context is
// pre-scaled by the device pixel ratio), so the button rectangles returned here line
// up with the pointer coordinates the input layer reads.

import { SHIP_CRUISE_MAX, SHIP_BOOST_MAX } from './ship.js';
import { formatTime } from './hud.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.W = 0;
    this.H = 0;
    this.scale = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.W = cssW;
    this.H = cssH;
    this.scale = cssH / 720; // world units of height kept in view
  }

  // Layout of the on-screen buttons, returned so input can hit-test them.
  buttonLayout() {
    const m = 20;
    const b = Math.max(60, Math.min(this.W, this.H) * 0.14);
    const big = b * 1.2;
    return {
      left: { x: m, y: this.H - m - b, w: b, h: b },
      right: { x: m + b + 12, y: this.H - m - b, w: b, h: b },
      boost: { x: this.W - m - big, y: this.H - m - big, w: big, h: big },
      restart: { x: this.W - 12 - 44, y: 12, w: 44, h: 44 },
    };
  }

  toScreen(cam, wx, wy) {
    return { x: (wx - cam.x) * this.scale + this.W / 2, y: (wy - cam.y) * this.scale + this.H / 2 };
  }

  draw(game) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._background();
    if (!game.level) return this.buttonLayout();

    const cam = game.camera;
    this._grid(cam);
    this._walls(game.level, cam);
    this._checkpoints(game.level, cam);
    this._finish(game.level, cam, game.time);
    this._ship(game.ship, game.level.theme, cam);
    this._hud(game);
    return this.buttonLayout();
  }

  _background() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, '#080a16');
    g.addColorStop(1, '#04050c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  _grid(cam) {
    const ctx = this.ctx;
    const step = 200 * this.scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(90,120,200,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const ox = ((-cam.x * this.scale + this.W / 2) % step + step) % step;
    for (let x = ox; x < this.W; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.H);
    }
    const oy = ((-cam.y * this.scale + this.H / 2) % step + step) % step;
    for (let y = oy; y < this.H; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.W, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  _walls(level, cam) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = level.theme.glow;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = level.theme.wall;
    ctx.lineWidth = 3;
    for (const poly of level.def.walls) {
      ctx.beginPath();
      for (let i = 0; i < poly.length; i++) {
        const s = this.toScreen(cam, poly[i].x, poly[i].y);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  _checkpoints(level, cam) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(140,170,255,0.18)';
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 2;
    for (const cx of level.checkpoints) {
      const top = this.toScreen(cam, cx, level.bounds.top);
      const bot = this.toScreen(cam, cx, level.bounds.bottom);
      if (top.x < -20 || top.x > this.W + 20) continue;
      ctx.beginPath();
      ctx.moveTo(top.x, Math.max(0, top.y));
      ctx.lineTo(bot.x, Math.min(this.H, bot.y));
      ctx.stroke();
    }
    ctx.restore();
  }

  _finish(level, cam, time) {
    const ctx = this.ctx;
    const x = level.finishX;
    const top = this.toScreen(cam, x, level.bounds.top);
    const bot = this.toScreen(cam, x, level.bounds.bottom);
    if (top.x < -40 || top.x > this.W + 40) return;
    const pulse = 0.6 + 0.4 * Math.sin(time * 5);
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 18 * pulse;
    ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.35 * pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(top.x, Math.max(-20, top.y));
    ctx.lineTo(bot.x, Math.min(this.H + 20, bot.y));
    ctx.stroke();
    // Checkered blocks along the gate.
    const y0 = Math.max(0, top.y);
    const y1 = Math.min(this.H, bot.y);
    ctx.shadowBlur = 0;
    for (let y = y0, k = 0; y < y1; y += 14, k++) {
      ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(top.x - 3, y, 6, 14);
    }
    ctx.restore();
  }

  _ship(ship, theme, cam) {
    const ctx = this.ctx;
    // Trail.
    if (ship.trail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < ship.trail.length; i++) {
        const a = this.toScreen(cam, ship.trail[i - 1].x, ship.trail[i - 1].y);
        const b = this.toScreen(cam, ship.trail[i].x, ship.trail[i].y);
        const alpha = (i / ship.trail.length) * 0.5;
        ctx.strokeStyle = ship.grinding ? `rgba(255,255,255,${alpha})` : `rgba(120,200,255,${alpha})`;
        ctx.lineWidth = (i / ship.trail.length) * 6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    const s = this.toScreen(cam, ship.pos.x, ship.pos.y);
    const r = 13;
    const glow = ship.boosting ? '#fff2a8' : ship.grinding ? '#ffffff' : theme.accent;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = glow;
    ctx.shadowBlur = ship.boosting ? 26 : 16;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.8, r * 0.7);
    ctx.lineTo(-r * 0.45, 0);
    ctx.lineTo(-r * 0.8, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _hud(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textBaseline = 'top';

    // Level name (top-left).
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,200,255,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(game.level.name.toUpperCase(), 16, 16);

    // Timer (top-centre).
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillStyle = '#eaf6ff';
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(game.time), this.W / 2, 12);

    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,200,255,0.55)';
    const bestTxt = game.best != null ? `best ${formatTime(game.best)}` : `par ${formatTime(game.level.par)}`;
    ctx.fillText(bestTxt, this.W / 2, 48);

    // Boost meter (bottom-centre).
    const mw = Math.min(240, this.W * 0.5);
    const mx = (this.W - mw) / 2;
    const my = this.H - 26;
    ctx.fillStyle = 'rgba(20,28,52,0.85)';
    roundRect(ctx, mx, my, mw, 10, 5);
    ctx.fill();
    const c = game.ship.charge;
    ctx.fillStyle = c > 0.001 ? (game.ship.boosting ? '#fff2a8' : game.level.theme.accent) : 'rgba(80,100,150,0.5)';
    ctx.shadowColor = game.level.theme.glow;
    ctx.shadowBlur = c > 0.5 ? 10 : 0;
    roundRect(ctx, mx, my, mw * c, 10, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,200,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('BOOST', this.W / 2, my - 14);

    // Speed readout (bottom-left of centre).
    const spd = Math.round((game.ship.speed / SHIP_BOOST_MAX) * 100);
    ctx.textAlign = 'right';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,200,255,0.5)';
    ctx.fillText(`${spd}%`, mx - 12, my - 4);

    // Progress bar under the timer.
    const prog = Math.max(0, Math.min(1, (game.ship.pos.x - game.level.start.x) / (game.level.finishX - game.level.start.x)));
    ctx.fillStyle = 'rgba(120,150,220,0.25)';
    roundRect(ctx, this.W / 2 - 90, 70, 180, 4, 2);
    ctx.fill();
    ctx.fillStyle = game.level.theme.wall;
    roundRect(ctx, this.W / 2 - 90, 70, 180 * prog, 4, 2);
    ctx.fill();

    ctx.restore();

    this._buttons(game);
  }

  _buttons(game) {
    const ctx = this.ctx;
    const L = this.buttonLayout();
    // Restart is always shown.
    this._btn(L.restart, '↺', 0.5);
    if (!game.showTouch) return;
    this._btn(L.left, '◀', 0.4);
    this._btn(L.right, '▶', 0.4);
    this._btn(L.boost, '▲', 0.55, game.level ? game.level.theme.accent : '#38f0d0');
  }

  _btn(rect, glyph, alpha, tint) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,28,52,0.75)';
    ctx.strokeStyle = tint || 'rgba(150,180,255,0.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.min(16, rect.w / 4));
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = Math.min(1, alpha + 0.4);
    ctx.fillStyle = tint || '#cfe0ff';
    ctx.font = `${Math.round(rect.h * 0.4)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
