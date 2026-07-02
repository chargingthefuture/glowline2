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

// --- Level 4: gravity. A wide cave that pulls you down; aim up to hold a line,
// and grind the ceiling or floor to keep the boost topped up. ------------
function level4() {
  const length = 6600;
  const mid = (x) => 520 + Math.sin(x / 900) * 60;
  const half = () => 175;
  const { top, bottom } = corridor({ length, mid, half });
  const walls = [top, bottom];
  for (let x = 1200; x < length - 700; x += 780) {
    const ceiling = ((x / 780) | 0) % 2 === 0;
    const m = mid(x);
    const y = ceiling ? m - 175 + 60 : m + 175 - 60; // stalactite from the roof / stalagmite from the floor
    walls.push(pillar(x, y, 34, 74, 4, Math.PI / 4));
  }
  return {
    name: 'Gravity Well',
    theme: { wall: '#ffb020', glow: 'rgba(255,176,32,0.5)', accent: '#ffd98a' },
    par: 40,
    gravity: { x: 0, y: 250 },
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 200,
    bounds: { left: -80, right: length + 80, top: -400, bottom: 1400 },
    checkpoints: [1500, 3000, 4500, 5800],
    walls,
  };
}

// --- Level 5: heavier gravity, a tighter cave, obstacles from both sides. -
function level5() {
  const length = 7000;
  const mid = (x) => 540 + Math.sin(x / 780) * 90 + Math.sin(x / 240) * 20;
  const half = (x) => 138 - Math.sin(x / 800) * 12;
  const { top, bottom } = corridor({ length, mid, half });
  const walls = [top, bottom];
  for (let x = 1000; x < length - 700; x += 560) {
    const ceiling = ((x / 560) | 0) % 2 === 0;
    const m = mid(x);
    const h = half(x);
    const y = ceiling ? m - h + 48 : m + h - 48;
    walls.push(pillar(x, y, 30, 62, 4, Math.PI / 4));
  }
  return {
    name: 'Undertow',
    theme: { wall: '#ff7043', glow: 'rgba(255,112,67,0.5)', accent: '#ffb59b' },
    par: 48,
    gravity: { x: 0, y: 340 },
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 220,
    bounds: { left: -80, right: length + 80, top: -500, bottom: 1500 },
    checkpoints: [1400, 2800, 4200, 5600, 6600],
    walls,
  };
}

// --- Level 6: steep switchbacks with pinch pillars. The corridor swings hard and
// narrow, so you have to slide the outer wall of each bend to hold your speed
// through it rather than nose in and stall. -------------------------------
function level6() {
  const length = 7600;
  const mid = (x) => 640 + Math.sin(x / 360) * 330 + Math.sin(x / 120) * 40;
  const half = (x) => 92 - Math.sin(x / 650) * 10;
  const { top, bottom } = corridor({ length, mid, half });
  const walls = [top, bottom];
  for (let x = 1000; x < length - 700; x += 520) {
    const s = ((x / 520) | 0) % 2 ? 1 : -1;
    walls.push(pillar(x, mid(x) + s * 44, 40, 60, 5, s * 0.5));
  }
  return {
    name: 'Hairpins',
    theme: { wall: '#5cff9e', glow: 'rgba(92,255,158,0.5)', accent: '#b9ffd6' },
    par: 52,
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 200,
    bounds: { left: -80, right: length + 80, top: -500, bottom: 1700 },
    checkpoints: [1500, 3000, 4500, 6000, 7000],
    walls,
  };
}

// --- Level 7: heavy gravity through a tight, winding cave with teeth from both
// sides. The pull is strong and the gaps are small, so you grind the roof and
// floor to keep the boost charged and thread each gate. --------------------
function level7() {
  const length = 7400;
  const mid = (x) => 700 + Math.sin(x / 520) * 300 + Math.cos(x / 175) * 44;
  const half = (x) => 104 - Math.sin(x / 720) * 14;
  const { top, bottom } = corridor({ length, mid, half });
  const walls = [top, bottom];
  for (let x = 900; x < length - 700; x += 470) {
    const ceiling = ((x / 470) | 0) % 2 === 0;
    const m = mid(x);
    const h = half(x);
    const y = ceiling ? m - h + 46 : m + h - 46;
    walls.push(pillar(x, y, 30, 58, 4, Math.PI / 4));
  }
  return {
    name: 'Riptide',
    theme: { wall: '#ff5cc8', glow: 'rgba(255,92,200,0.5)', accent: '#ffb3e6' },
    par: 58,
    gravity: { x: 0, y: 300 },
    start: { x: 120, y: mid(120), angle: 0 },
    finishX: length - 220,
    bounds: { left: -80, right: length + 80, top: -600, bottom: 1800 },
    checkpoints: [1400, 2800, 4200, 5600, 6800],
    walls,
  };
}

export const LEVELS = [level1(), level2(), level3(), level4(), level5(), level6(), level7()];
