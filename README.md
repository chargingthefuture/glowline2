# Glowline 2

A neon maze-runner for the browser. You steer a glowing dart left-to-right through a winding
corridor. The dart always flies forward — you only turn and boost. Brush a wall at a shallow angle to
charge your boost meter and keep your speed; hit a wall head-on and you bleed speed. Race the maze,
beat par, and chase your own best time.

It is a spin on the wall-riding navigation of Data Wing, carried into the Glowline look. This is
Glowline 2 — the horizontal-maze follow-up to the original Glowline.

## Play it

There is no build step. Two ways to run it:

- **Open the folder over a local server** (recommended — browsers only load ES modules over http):

  ```sh
  python3 -m http.server 8000
  # then open http://localhost:8000 in a browser
  ```

- **Host it as a static site** (for example GitHub Pages): serve the repository root as-is.

## Deploying to GitHub Pages

The repository ships a workflow (`.github/workflows/deploy-pages.yml`) that publishes the site on
every push to `main`. There is nothing to build — it uploads the repository root and hands it to
Pages. One-time setup in the repository: open **Settings → Pages → Build and deployment** and set the
**Source** to **GitHub Actions**. After that, each push to `main` deploys automatically, and the live
address shows up on the workflow run and under Settings → Pages.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Steer | Left / Right arrows, or A / D | The two buttons at bottom-left |
| Boost | Space or Up, or W | The button at bottom-right |
| Restart | R | The ↺ button at top-right |
| Sound on/off | M | The speaker button at top-right |

The boost only fires when the meter has charge. Fill it by sliding along the neon walls.

## Install it and play offline

Glowline 2 is a Progressive Web App — a web page you can install like an app. Open it in a browser
and choose "Add to Home Screen" (or the install option in the address bar); it then runs full-screen
and works with no network. A service worker (`sw.js`) caches every file the game needs, and the app
manifest (`manifest.webmanifest`) and icons under `assets/` make it installable.

If you change any file the game loads at runtime, keep two things in step in `sw.js`: add the file to
the `ASSETS` list, and bump the `CACHE` name (for example `glowline2-v1` → `glowline2-v2`) so
installed copies fetch the new version instead of the old cached one.

## Sound

All sound is generated in code with the Web Audio API — there are no audio files to load or cache.
You get a boost sweep, a wall-grinding hiss, a knock on head-on hits, and a finish chime. Sound
starts on your first key press or tap (browsers block it until then) and can be muted with M or the
speaker button; the mute setting is saved in your browser.

## Levels

Five hand-tuned mazes of rising difficulty. The first three — *First Light*, *Switchback*, and *The
Gauntlet* — are top-down cruises where you carve the corridor and ride the walls. The last two —
*Gravity Well* and *Undertow* — add a steady downward pull: you steer up to hold your line and grind
the roof or floor to keep the boost charged. Each level tracks a best time in your browser's local
storage; nothing is sent anywhere.

## How it fits together

Plain HTML, CSS, and JavaScript (ES modules) — no framework, no bundler, no dependencies.

| File | What it does |
| --- | --- |
| `index.html` | Page shell, the single `<canvas>`, and the menu / win overlays |
| `styles/style.css` | All styling for the page and overlays |
| `src/vec.js` | 2D vector maths and the segment/steering helpers |
| `src/input.js` | Keyboard and multi-touch input |
| `src/levels.js` | The five level definitions (wall shapes, start, finish, par, gravity) |
| `src/level.js` | Turns a level's polylines into collidable, x-bucketed segments |
| `src/ship.js` | Ship physics: thrust, steering, wall collisions, and boost charge |
| `src/render.js` | All canvas drawing — maze, ship, HUD, and the touch buttons |
| `src/hud.js` | The DOM menu and win screens, plus time formatting |
| `src/audio.js` | Web Audio sound — all tones generated in code, plus the mute setting |
| `src/game.js` | States, camera, timer, best-time storage, and the frame loop |
| `src/main.js` | Entry point, and service-worker registration |
| `sw.js` | Service worker: precache the files for offline play |
| `manifest.webmanifest` | App manifest so the game installs to a home screen |
| `assets/` | App icons, and `make_icons.py` that draws them (standard library only) |

## Changing it

- **Tune the feel** in `src/ship.js` — the constants at the top control turn rate, top speed, boost,
  and how much a grind rewards you.
- **Add or reshape a level** in `src/levels.js` — a level is a centreline, a half-width, and any
  pillars you drop in. Add a `gravity: { x, y }` field to make it a gravity maze.
- **Redraw the app icons** with `python3 assets/make_icons.py` (standard library only), then bump the
  `CACHE` name in `sw.js` so installed copies pick up the new icons.

There is no automated test suite. After changing physics or a level, play it in a browser and confirm
the maze can still be completed before opening a pull request.
