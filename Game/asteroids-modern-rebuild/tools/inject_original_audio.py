#!/usr/bin/env python3
"""Inline selected original SWF sounds into the self-contained game HTML."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def load_audio(source: Path) -> dict[str, str]:
    raw = {}
    for line in source.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        key, value = line.split("=", 1)
        raw[key] = "data:audio/mpeg;base64," + value
    return {
        "thrust": raw["sound_1"],
        "saucerSmall": raw["sound_2"],
        "saucerBig": raw["sound_3"],
        "beat2": raw["sound_4"],
        "beat1": raw["sound_5"],
    }


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: inject_original_audio.py INPUT.html BASE64.txt", file=sys.stderr)
        return 2
    html_path, audio_path = map(Path, sys.argv[1:])
    html = html_path.read_text(encoding="utf-8")
    if "const ORIGINAL_AUDIO" in html:
        raise RuntimeError("Original audio appears to have already been injected")
    object_literal = json.dumps(load_audio(audio_path), ensure_ascii=False, separators=(",", ":"))
    html = html.replace("    class AudioBank {", f"    const ORIGINAL_AUDIO = {object_literal};\n\n    class AudioBank {{", 1)
    html = html.replace(
        "      constructor() { this.context = null; this.last = {}; this.enabled = true; }",
        "      constructor() { this.context = null; this.last = {}; this.originalLast = {}; this.enabled = true; }",
        1,
    )
    marker = "      tone(name, frequency, duration, type, volume, drift = 0) {"
    original_method = """      playOriginal(name) {
        const source = ORIGINAL_AUDIO[name];
        if (!source) return false;
        const now = performance.now();
        const minimumGap = name === 'thrust' ? 115 : 75;
        if (now - (this.originalLast[name] || 0) < minimumGap) return true;
        this.originalLast[name] = now;
        const clip = new Audio(source);
        clip.volume = name === 'thrust' ? .2 : .34;
        clip.play().catch(() => {});
        return true;
      }
"""
    html = html.replace(marker, original_method + marker, 1)
    old_play = "      play(name) { const tones={thrust:[74,.08,'sawtooth',.025,25],fire:[780,.10,'square',.055,-510],beat1:[114,.11,'sine',.06,-20],beat2:[92,.11,'sine',.06,-12],bang:[170,.2,'sawtooth',.055,-130],saucer:[270,.18,'triangle',.038,70],warp:[440,.22,'sine',.05,360],life:[540,.32,'sine',.05,240]}; const t=tones[name]; if(t)this.tone(name,...t); }"
    new_play = "      play(name) { const originalName={thrust:'thrust',beat1:'beat1',beat2:'beat2',saucer:'saucerBig'}[name]; if (originalName && this.playOriginal(originalName)) return; const tones={thrust:[74,.08,'sawtooth',.025,25],fire:[780,.10,'square',.055,-510],beat1:[114,.11,'sine',.06,-20],beat2:[92,.11,'sine',.06,-12],bang:[170,.2,'sawtooth',.055,-130],saucer:[270,.18,'triangle',.038,70],warp:[440,.22,'sine',.05,360],life:[540,.32,'sine',.05,240]}; const t=tones[name]; if(t)this.tone(name,...t); }"
    if old_play not in html:
        raise RuntimeError("The expected AudioBank.play implementation was not found")
    html = html.replace(old_play, new_play, 1)
    html_path.write_text(html, encoding="utf-8")
    print(f"Injected 5 original MP3 clips into {html_path} ({html_path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
