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

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Steer | Left / Right arrows, or A / D | The two buttons at bottom-left |
| Boost | Space or Up, or W | The button at bottom-right |
| Restart | R | The ↺ button at top-right |

The boost only fires when the meter has charge. Fill it by sliding along the neon walls.

## Levels

Three hand-tuned mazes of rising difficulty — *First Light*, *Switchback*, and *The Gauntlet*. Each
tracks a best time in your browser's local storage; nothing is sent anywhere.

## How it fits together

Plain HTML, CSS, and JavaScript (ES modules) — no framework, no bundler, no dependencies.

| File | What it does |
| --- | --- |
| `index.html` | Page shell, the single `<canvas>`, and the menu / win overlays |
| `styles/style.css` | All styling for the page and overlays |
| `src/vec.js` | 2D vector maths and the segment/steering helpers |
| `src/input.js` | Keyboard and multi-touch input |
| `src/levels.js` | The three level definitions (wall shapes, start, finish, par) |
| `src/level.js` | Turns a level's polylines into collidable, x-bucketed segments |
| `src/ship.js` | Ship physics: thrust, steering, wall collisions, and boost charge |
| `src/render.js` | All canvas drawing — maze, ship, HUD, and the touch buttons |
| `src/hud.js` | The DOM menu and win screens, plus time formatting |
| `src/game.js` | States, camera, timer, best-time storage, and the frame loop |
| `src/main.js` | Entry point |

## Changing it

- **Tune the feel** in `src/ship.js` — the constants at the top control turn rate, top speed, boost,
  and how much a grind rewards you.
- **Add or reshape a level** in `src/levels.js` — a level is a centreline, a half-width, and any
  pillars you drop in.

There is no automated test suite. After changing physics or a level, play it in a browser and confirm
the maze can still be completed before opening a pull request.
