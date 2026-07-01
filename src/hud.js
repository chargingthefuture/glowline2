// The DOM overlays: title/level-select and the win screen. Also the one shared time
// formatter used by both the overlays and the in-game HUD.

export function formatTime(seconds) {
  if (seconds == null || !isFinite(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  const ss = s.toFixed(2).padStart(5, '0');
  return `${m}:${ss}`;
}

export class Hud {
  constructor(handlers) {
    this.handlers = handlers;
    this.menu = document.getElementById('menu');
    this.win = document.getElementById('win');
    this.levelList = document.getElementById('levelList');
    this.winTitle = document.getElementById('winTitle');
    this.winTimes = document.getElementById('winTimes');

    document.getElementById('btnNext').addEventListener('click', () => handlers.onNext());
    document.getElementById('btnReplay').addEventListener('click', () => handlers.onReplay());
    document.getElementById('btnMenu').addEventListener('click', () => handlers.onMenu());
  }

  showMenu(levels, bests) {
    this.win.classList.add('hidden');
    this.menu.classList.remove('hidden');
    this.levelList.innerHTML = '';
    levels.forEach((lvl, i) => {
      const card = document.createElement('button');
      card.className = 'level-card';
      const best = bests[i] != null ? `best ${formatTime(bests[i])}` : 'not yet run';
      card.innerHTML =
        `<span class="idx">LEVEL ${i + 1}</span>` +
        `<span class="name">${lvl.name}</span>` +
        `<span class="meta">par ${formatTime(lvl.par)}</span>` +
        `<span class="best">${best}</span>`;
      card.addEventListener('click', () => this.handlers.onSelectLevel(i));
      this.levelList.appendChild(card);
    });
  }

  hideMenu() {
    this.menu.classList.add('hidden');
  }

  showWin({ time, best, isRecord, hasNext }) {
    this.win.classList.remove('hidden');
    this.winTitle.textContent = isRecord ? 'New record!' : 'Finished';
    this.winTimes.innerHTML =
      `<div><span class="lbl">time</span> ${formatTime(time)}</div>` +
      `<div class="${isRecord ? 'record' : ''}"><span class="lbl">best</span> ${formatTime(best)}</div>`;
    document.getElementById('btnNext').style.display = hasNext ? '' : 'none';
  }

  hideWin() {
    this.win.classList.add('hidden');
  }
}
