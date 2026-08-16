#!/usr/bin/env python3
"""Static SWF inspector for a user-supplied legacy game.

The script never loads a Flash runtime or evaluates ActionScript. It only
decompresses a CWS container, walks SWF tag headers, records metadata, and
extracts embedded DefineSound/MP3 payloads for attribution-preserving reuse.
"""

from __future__ import annotations

import json
import re
import struct
import sys
import zlib
from collections import Counter
from pathlib import Path


TAG_NAMES = {
    0: "End",
    1: "ShowFrame",
    2: "DefineShape",
    4: "PlaceObject",
    5: "RemoveObject",
    6: "DefineBits",
    7: "DefineButton",
    8: "JPEGTables",
    9: "SetBackgroundColor",
    10: "DefineFont",
    11: "DefineText",
    12: "DoAction",
    14: "DefineSound",
    15: "StartSound",
    18: "SoundStreamHead",
    19: "SoundStreamBlock",
    20: "DefineBitsLossless",
    21: "DefineBitsJPEG2",
    22: "DefineShape2",
    24: "Protect",
    26: "PlaceObject2",
    28: "RemoveObject2",
    32: "DefineShape3",
    34: "DefineButton2",
    35: "DefineBitsJPEG3",
    36: "DefineBitsLossless2",
    37: "DefineEditText",
    39: "DefineSprite",
    43: "FrameLabel",
    45: "SoundStreamHead2",
    48: "DefineFont2",
    56: "ExportAssets",
    57: "ImportAssets",
    59: "DoInitAction",
    60: "DefineVideoStream",
    61: "VideoFrame",
    62: "DefineFontInfo2",
    64: "EnableDebugger2",
    65: "ScriptLimits",
    69: "FileAttributes",
    70: "PlaceObject3",
    71: "ImportAssets2",
    73: "DefineFontAlignZones",
    74: "CSMTextSettings",
    75: "DefineFont3",
    76: "SymbolClass",
    77: "Metadata",
    82: "DoABC",
    83: "DefineShape4",
    84: "DefineMorphShape2",
    86: "DefineSceneAndFrameLabelData",
}

SOUND_FORMATS = {
    0: "uncompressed-native-endian",
    1: "ADPCM",
    2: "MP3",
    3: "uncompressed-little-endian",
    6: "Nellymoser",
}


def read_rect(data: bytes, offset: int) -> tuple[dict[str, float], int]:
    """Read the bit-packed SWF RECT and return pixel bounds plus next offset."""
    nbits = data[offset] >> 3
    bitpos = offset * 8 + 5
    values: list[int] = []
    for _ in range(4):
        value = 0
        for _ in range(nbits):
            byte_index, bit_index = divmod(bitpos, 8)
            value = (value << 1) | ((data[byte_index] >> (7 - bit_index)) & 1)
            bitpos += 1
        if value & (1 << (nbits - 1)):
            value -= 1 << nbits
        values.append(value)
    xmin, xmax, ymin, ymax = values
    return {
        "xmin_px": xmin / 20,
        "xmax_px": xmax / 20,
        "ymin_px": ymin / 20,
        "ymax_px": ymax / 20,
        "width_px": (xmax - xmin) / 20,
        "height_px": (ymax - ymin) / 20,
    }, (bitpos + 7) // 8


def decode_swf(path: Path) -> bytes:
    raw = path.read_bytes()
    if len(raw) < 8 or raw[:3] not in (b"FWS", b"CWS"):
        raise ValueError("Not a supported FWS/CWS SWF file")
    if raw[:3] == b"FWS":
        return raw
    return b"FWS" + raw[3:8] + zlib.decompress(raw[8:])


def printable_strings(data: bytes) -> list[str]:
    """Collect low-risk readable strings without attempting to execute bytecode."""
    strings = set()
    for match in re.finditer(rb"[ -~]{4,}", data):
        value = match.group().decode("latin-1", errors="replace").strip()
        if value and len(value) <= 160:
            strings.add(value)
    return sorted(strings, key=lambda s: (s.lower(), s))


def parse_tags(
    data: bytes,
    offset: int,
    scope: str,
    tags: list[dict],
    sounds: list[dict],
    exports: dict[int, str],
    start_sounds: list[dict],
) -> None:
    """Walk SWF tags, recursively entering DefineSprite timelines."""
    while offset + 2 <= len(data):
        header = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        code, length = header >> 6, header & 0x3F
        if length == 0x3F:
            if offset + 4 > len(data):
                break
            length = struct.unpack_from("<I", data, offset)[0]
            offset += 4
        if offset + length > len(data):
            break
        body = data[offset : offset + length]
        tags.append({"scope": scope, "code": code, "name": TAG_NAMES.get(code, f"Tag{code}"), "length": length})

        if code == 14 and len(body) >= 7:
            sound_id = struct.unpack_from("<H", body, 0)[0]
            spec = body[2]
            sound_format = spec >> 4
            rate_code = (spec >> 2) & 0x03
            rate = [5512, 11025, 22050, 44100][rate_code]
            sound_type = "stereo" if (spec & 0x01) else "mono"
            sample_count = struct.unpack_from("<I", body, 3)[0]
            payload_offset = 7 + (2 if sound_format == 2 else 0)
            sounds.append(
                {
                    "id": sound_id,
                    "format": SOUND_FORMATS.get(sound_format, f"format-{sound_format}"),
                    "sample_rate_hz": rate,
                    "channels": sound_type,
                    "sample_count": sample_count,
                    "payload": body[payload_offset:],
                }
            )
        elif code == 15 and len(body) >= 2:
            start_sounds.append(
                {
                    "scope": scope,
                    "sound_id": struct.unpack_from("<H", body, 0)[0],
                }
            )
        elif code == 39 and len(body) >= 4:
            sprite_id, frame_count = struct.unpack_from("<HH", body, 0)
            parse_tags(
                body,
                4,
                f"sprite:{sprite_id} ({frame_count} frames)",
                tags,
                sounds,
                exports,
                start_sounds,
            )
        elif code == 56 and len(body) >= 2:
            export_count = struct.unpack_from("<H", body, 0)[0]
            cursor = 2
            for _ in range(export_count):
                if cursor + 2 > len(body):
                    break
                character_id = struct.unpack_from("<H", body, cursor)[0]
                cursor += 2
                end = body.find(b"\x00", cursor)
                if end < 0:
                    break
                exports[character_id] = body[cursor:end].decode("latin-1", errors="replace")
                cursor = end + 1
        if code == 0:
            return
        offset += length


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: analyze_swf.py INPUT.swf OUTPUT_DIR", file=sys.stderr)
        return 2
    swf_path, output_dir = Path(sys.argv[1]), Path(sys.argv[2])
    output_dir.mkdir(parents=True, exist_ok=True)
    decoded = decode_swf(swf_path)
    rect, pos = read_rect(decoded, 8)
    fps_raw, frames = struct.unpack_from("<HH", decoded, pos)
    # SWF stores the stage rate as an unsigned 8.8 little-endian fixed point.
    fps = fps_raw / 256
    tags: list[dict] = []
    sounds: list[dict] = []
    exports: dict[int, str] = {}
    start_sounds: list[dict] = []
    parse_tags(decoded, pos + 4, "root", tags, sounds, exports, start_sounds)

    written_sounds = []
    for sound in sounds:
        extension = "mp3" if sound["format"] == "MP3" else "bin"
        filename = f"sound_{sound['id']}.{extension}"
        (output_dir / filename).write_bytes(sound.pop("payload"))
        written_sounds.append({**sound, "file": filename, "linkage_name": exports.get(sound["id"])})

    tag_counts = Counter(tag["name"] for tag in tags)
    report = {
        "input": str(swf_path),
        "signature": "FWS (decoded from CWS)" if swf_path.read_bytes()[:3] == b"CWS" else "FWS",
        "version": decoded[3],
        "uncompressed_bytes": len(decoded),
        "stage": rect,
        "frame_rate": fps,
        "frame_count": frames,
        "tag_counts": dict(sorted(tag_counts.items())),
        "exported_assets": {str(key): value for key, value in sorted(exports.items())},
        "timeline_sound_triggers": start_sounds,
        "sounds": written_sounds,
        "readable_strings": printable_strings(decoded),
        "note": "Static parse only: ActionScript was not executed or decompiled into behavior.",
    }
    (output_dir / "analysis.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "asteroids_uncompressed.fws").write_bytes(decoded)
    print(json.dumps({k: report[k] for k in ("version", "stage", "frame_rate", "frame_count", "tag_counts", "sounds")}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
