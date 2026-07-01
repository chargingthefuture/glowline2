// Level definitions. Each maze is a set of wall polylines the ship must thread
// left-to-right. Corridors are built from a centreline plus a half-width so the
// shapes stay smooth and reproducible; pillars are closed loops dropped inside.

// Build the two edges of a winding corridor by sampling a centre and half-width.
function corridor({ length, step = 40, mid, half }) {
  const top = [];
  const bottom = [];
  for (let x = 0; x <= length; x += step) {
    const m = mid(x);
    const h = half(x);
    top.push({ x, y: m - h });
    bottom.push({ x, y: m + h });
  }
  return { top, bottom };
}

// A closed polygon obstacle (an "island" in the corridor).
function pillar(cx, cy, rx, ry, sides = 6, rot = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  pts.push({ ...pts[0] }); // close the loop
  return pts;
}

// --- Level 1: wide, gentle waves, room to learn the wall-riding. ---------
function level1() {
  const length = 5200;
  const mid = (x) => 500 + Math.sin(x / 700) * 150;
  const half = () => 140;
  const { top, bottom } = corridor({ length, mid, half });
  return {
    name: 'First Light',
    theme: { wall: '#38f0d0', glow: 'rgba(56,240,208,0.55)', accent: '#8affee' },
    par: 26,
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 180,
    bounds: { left: -80, right: length + 80, top: -200, bottom: 1200 },
    checkpoints: [1300, 2600, 3900],
    walls: [
      top,
      bottom,
      pillar(2100, mid(2100), 70, 90, 6),
      pillar(3600, mid(3600) - 40, 60, 70, 5, 0.4),
    ],
  };
}

// --- Level 2: tighter, taller swings, staggered pillars. -----------------
function level2() {
  const length = 6400;
  const mid = (x) => 520 + Math.sin(x / 520) * 230 + Math.sin(x / 190) * 30;
  const half = (x) => 110 - Math.sin(x / 900) * 18;
  const { top, bottom } = corridor({ length, mid, half });
  const walls = [top, bottom];
  for (let x = 1200; x < length - 600; x += 900) {
    const up = ((x / 900) | 0) % 2 === 0;
    walls.push(pillar(x, mid(x) + (up ? -55 : 55), 55, 75, 6, 0.3));
  }
  return {
    name: 'Switchback',
    theme: { wall: '#7c5cff', glow: 'rgba(124,92,255,0.55)', accent: '#c3b4ff' },
    par: 34,
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 200,
    bounds: { left: -80, right: length + 80, top: -300, bottom: 1300 },
    checkpoints: [1500, 3000, 4500, 5800],
    walls,
  };
}

// --- Level 3: narrow gauntlet, alternating gates. ------------------------
function level3() {
  const length = 7200;
  const mid = (x) => 540 + Math.sin(x / 430) * 250 + Math.cos(x / 150) * 34;
  const half = (x) => 96 - Math.sin(x / 700) * 10;
  const { top, bottom } = corridor({ length, mid, half });
  const walls = [top, bottom];
  for (let x = 1100; x < length - 700; x += 620) {
    const side = ((x / 620) | 0) % 2 === 0 ? -1 : 1;
    walls.push(pillar(x, mid(x) + side * 46, 40, 62, 5, side * 0.5));
  }
  return {
    name: 'The Gauntlet',
    theme: { wall: '#ff4d9d', glow: 'rgba(255,77,157,0.55)', accent: '#ffb3d4' },
    par: 44,
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 220,
    bounds: { left: -80, right: length + 80, top: -400, bottom: 1500 },
    checkpoints: [1400, 2800, 4200, 5600, 6600],
    walls,
  };
}

export const LEVELS = [level1(), level2(), level3()];
