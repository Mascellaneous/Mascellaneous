# 皮蛋大逃殺 / Kill Peter Wong — Browser Remake

This folder contains a browser-native reconstruction of the supplied `KillPeterWong.swf`. It preserves the source’s **900 × 500 stage**, hand-drawn cyan rules screen, outdoor playfield, egg-shaped target, **1000 HP** counter, and **20 HP per hit** click rule. The implementation is deliberately dependency-free: it uses only HTML, CSS, JavaScript, and local art files.

## Run locally

Open [`index.html`](./index.html) in a modern browser. There is no build step, package installation, CDN request, plugin, Flash runtime, or server requirement. Click the egg in the briefing screen to begin, then click the moving target to reduce its health. Press `R` at any time to return to the briefing screen.

## Project contents

| Path | Purpose |
| --- | --- |
| `index.html` | Accessible page structure and game-stage markup. |
| `styles.css` | Responsive archival framing, original-stage presentation, controls, and reduced-motion handling. |
| `app.js` | Dependency-free interaction state, hit detection, target movement, health tracking, and reset behavior. |
| `assets/intro-stage.png` | Original SWF briefing artwork captured during local playback. |
| `assets/playfield.png` | Original SWF outdoor scene artwork captured during local playback. |
| `assets/egg-target.png` | Original SWF egg-character artwork, keyed for use as the moving target. |

## Reverse-engineering notes

The supplied file is an uncompressed **Flash 5** SWF with a 900 × 500 stage, 12 fps timeline, and 280 frames. Its initialization script sets `life` to `1000`, and the target button handler subtracts `20` on pointer press. When life reaches zero, the SWF branches to its terminal timeline sequence. The recreation implements that same visible rule in browser-native JavaScript and intentionally avoids shipping the original SWF or a Flash emulator.

The original artwork is included solely for this user-directed reconstruction. Verify your permission to distribute the supplied source artwork before publishing it more broadly.

