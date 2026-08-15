# 皮蛋大逃殺 / Kill Peter Wong — Browser Remake

This folder contains a browser-native reconstruction of the supplied `KillPeterWong.swf`. It preserves the source’s **900 × 500 stage**, hand-drawn cyan rules screen, outdoor playfield, egg-shaped target, **1000 HP** counter, and **20 HP per hit** click rule. The implementation is deliberately dependency-free: it uses only HTML, CSS, JavaScript, and local art files.

## Run locally

Open [`index.html`](./index.html) in a modern browser. There is no build step, package installation, CDN request, plugin, Flash runtime, or server requirement. Click the egg in the briefing screen to begin, then click the moving target to reduce its health. Press `R` at any time to return to the briefing screen.

## Complete original-source extraction

The repository now contains the complete recoverable asset export beneath [`assets/swf-export/`](./assets/swf-export/), together with the untouched supplied SWF in [`source/KillPeterWong.swf`](./source/KillPeterWong.swf). The generated [asset manifest](./assets/swf-export/ASSET_MANIFEST.md) indexes all recovered files, including **280 main-timeline frames**, **4 sprite images**, **12 button states**, **12 SVG shapes**, **10 morph-shape frames**, **2 fonts**, **8 text definitions**, **34 ActionScript files**, and **2 sound-stream exports**.

The implementation exposes the original exported MP3 stream in the expanded “Complete source extraction” panel. Its **Replay all 280 source frames** control displays every exported main-timeline PNG at the original 12 fps, so the complete recovered background and animation sequence is actively usable rather than only stored in the archive. The panel also shows a source-derived timeline contact sheet and preserves the full visual/audio archive locally, so it remains accessible without a network request or Flash runtime.

## Project contents

| Path | Purpose |
| --- | --- |
| `index.html` | Accessible page structure and game-stage markup. |
| `styles.css` | Responsive archival framing, original-stage presentation, controls, and reduced-motion handling. |
| `app.js` | Dependency-free interaction state, hit detection, target movement, health tracking, and reset behavior. |
| `assets/intro-stage.png` | Original SWF briefing artwork captured during local playback. |
| `assets/playfield.png` | Original SWF outdoor scene artwork captured during local playback. |
| `assets/egg-target.png` | Original SWF egg-character artwork, keyed for use as the moving target. |
| `assets/swf-export/` | Complete JPEXS export, including every recoverable timeline frame, sprite, vector, script, font, text, and sound asset. |
| `source/KillPeterWong.swf` | Untouched supplied source file, retained with the extracted archive. |

## Reverse-engineering notes

The supplied file is an uncompressed **Flash 5** SWF with a 900 × 500 stage, 12 fps timeline, and 280 frames. Its initialization script sets `life` to `1000`, and the target button handler subtracts `20` on pointer press. When life reaches zero, the SWF branches to its terminal timeline sequence. The recreation implements that same visible rule in browser-native JavaScript and intentionally avoids shipping the original SWF or a Flash emulator.

The original artwork is included solely for this user-directed reconstruction. Verify your permission to distribute the supplied source artwork before publishing it more broadly.
