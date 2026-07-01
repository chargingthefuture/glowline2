// Procedural sound — every tone is generated with the Web Audio API, so there are
// no audio files to load, ship, or cache. It must be started from a user gesture
// (browsers, and iOS in particular, block sound until the player interacts).
//
// The mute setting is saved in the browser so it sticks between runs.

let ctx = null;
let master = null;      // everything routes through here; muting sets it to 0
let grindGain = null;   // the continuous wall-grinding hiss
let grindFilter = null;
let started = false;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('glowline2.muted') === '1'; } catch (_) { return false; }
}

function now() { return ctx.currentTime; }

// A short looping noise buffer, reused for the grind hiss and the crash thud.
function makeNoise() {
  const len = ctx.sampleRate * 0.5;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // A fixed pseudo-random sequence (no Math.random needed): a simple LCG.
  let seed = 1234567;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data[i] = (seed / 0x3fffffff) - 1;
  }
  return buf;
}

// iOS treats Web Audio as "ambient" by default, so the ringer/mute switch can
// silence an installed app entirely. Asking for the "playback" session (where
// supported) makes the game play through the switch.
function claimPlayback() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (_) { /* not supported — keep the default */ }
}

export function start() {
  claimPlayback();
  if (started) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.85;
  master.connect(ctx.destination);

  // Continuous grind chain: noise -> band-pass -> gain (starts silent).
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoise();
  noise.loop = true;
  grindFilter = ctx.createBiquadFilter();
  grindFilter.type = 'bandpass';
  grindFilter.frequency.value = 1200;
  grindFilter.Q.value = 0.8;
  grindGain = ctx.createGain();
  grindGain.gain.value = 0;
  noise.connect(grindFilter).connect(grindGain).connect(master);
  noise.start();

  started = true;
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('glowline2.muted', m ? '1' : '0'); } catch (_) {}
  if (master) master.gain.value = m ? 0 : 0.85;
  return muted;
}
export function toggleMute() { return setMuted(!muted); }
export function isMuted() { return muted; }

// One short tone with a quick attack and exponential fall.
function tone(freq, t, dur, type, peak, dest) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// ---- effects (all no-ops until start() runs) ----

// Wall grinding: called every frame. `active` fades the hiss in and out;
// `intensity` (0..1) brightens it with speed.
export function grind(active, intensity = 1) {
  if (!grindGain) return;
  const target = active ? 0.05 + 0.05 * intensity : 0;
  grindGain.gain.setTargetAtTime(target, now(), 0.06);
  grindFilter.frequency.setTargetAtTime(700 + 1600 * intensity, now(), 0.06);
}

export function boost() {
  if (!ctx) return;
  const t = now() + 0.01;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(660, t + 0.25);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.35);
}

export function crash(strength = 1) {
  if (!ctx) return;
  const t = now() + 0.005;
  const src = ctx.createBufferSource();
  src.buffer = makeNoise();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 500;
  const g = ctx.createGain();
  const peak = 0.05 + 0.12 * Math.min(1, strength);
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.2);
}

export function finish() {
  if (!ctx) return;
  const t = now() + 0.01;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, 0.4, 'triangle', 0.12));
}

export function respawn() {
  if (!ctx) return;
  const t = now() + 0.01;
  tone(440, t, 0.14, 'sine', 0.08);
  tone(294, t + 0.08, 0.18, 'sine', 0.08);
}

export function blip() {
  if (!ctx) return;
  tone(660, now() + 0.01, 0.09, 'square', 0.07);
}
