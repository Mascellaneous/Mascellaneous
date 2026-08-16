#!/usr/bin/env python3
"""Build a genuinely single-file Asteroids HTML from local generated assets."""

from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

from PIL import Image


def webp_data_url(path: Path, size: tuple[int, int], quality: int) -> str:
    with Image.open(path) as image:
        image.thumbnail(size, Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        out = io.BytesIO()
        image.save(out, format="WEBP", quality=quality, method=6)
    return "data:image/webp;base64," + base64.b64encode(out.getvalue()).decode("ascii")


def main() -> int:
    if len(sys.argv) != 5:
        print("Usage: inline_game_assets.py INPUT.html LOGO.png STARFIELD.png OUTPUT.html", file=sys.stderr)
        return 2
    source, logo_file, starfield_file, output = map(Path, sys.argv[1:])
    html = source.read_text(encoding="utf-8")
    logo = webp_data_url(logo_file, (256, 256), 84)
    starfield = webp_data_url(starfield_file, (1600, 900), 64)
    html = html.replace('/manus-storage/asteroids-orbit-mark_68d63c10.png', logo)
    html = html.replace('/manus-storage/asteroids-starfield-texture_d9e9b222.png', starfield)
    if '/manus-storage/' in html:
        raise RuntimeError("A generated asset URL remained after inlining")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")
    print(f"Wrote {output} ({output.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
