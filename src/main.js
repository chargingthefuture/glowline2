// Entry point: wait for the DOM, then start the game on the single canvas.
import { Game } from './game.js';

function boot() {
  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  // Exposed for debugging and smoke tests; not used by the game itself.
  window.__glowline = game;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
