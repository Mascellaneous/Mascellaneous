#!/usr/bin/env python3
"""Static SWF inspector for the supplied file; it never executes ActionScript."""

from __future__ import annotations

import json
import struct
import sys
import zlib
from collections import Counter
from pathlib import Path


TAG_NAMES = {
    0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject", 5: "RemoveObject",
    6: "DefineBits", 7: "DefineButton", 9: "SetBackgroundColor", 10: "DefineFont",
    11: "DefineText", 12: "DoAction", 14: "DefineSound", 15: "StartSound",
    17: "DefineButtonSound", 18: "SoundStreamHead", 19: "SoundStreamBlock",
    20: "DefineBitsLossless", 21: "DefineBitsJPEG2", 22: "DefineShape2",
    23: "DefineButtonCxform", 26: "PlaceObject2", 28: "RemoveObject2",
    32: "DefineShape3", 33: "DefineText2", 34: "DefineButton2", 35: "DefineBitsJPEG3",
    36: "DefineBitsLossless2", 37: "DefineEditText", 39: "DefineSprite", 43: "FrameLabel",
    45: "SoundStreamHead2", 46: "DefineMorphShape", 48: "DefineFont2", 56: "ExportAssets",
    57: "ImportAssets", 58: "EnableDebugger", 59: "DoInitAction", 60: "DefineVideoStream",
    61: "VideoFrame", 62: "DefineFontInfo2", 64: "EnableDebugger2", 65: "ScriptLimits",
    69: "FileAttributes", 70: "PlaceObject3", 71: "ImportAssets2", 73: "DefineFontAlignZones",
    74: "CSMTextSettings", 75: "DefineFont3", 76: "SymbolClass", 77: "Metadata",
    82: "DoABC", 83: "DefineShape4", 84: "DefineMorphShape2", 86: "DefineSceneAndFrameLabelData",
}

ACTION_NAMES = {
    0x04: "NextFrame", 0x05: "PreviousFrame", 0x06: "Play", 0x07: "Stop",
    0x0A: "Add", 0x0B: "Subtract", 0x0C: "Multiply", 0x0D: "Divide",
    0x0E: "Equals", 0x0F: "Less", 0x10: "And", 0x11: "Or", 0x12: "Not",
    0x17: "Pop", 0x18: "ToInteger", 0x1C: "GetVariable", 0x1D: "SetVariable",
    0x20: "SetTarget2", 0x21: "StringAdd", 0x22: "GetProperty", 0x23: "SetProperty",
    0x24: "CloneSprite", 0x25: "RemoveSprite", 0x26: "Trace", 0x27: "StartDrag",
    0x28: "EndDrag", 0x29: "StringLess", 0x30: "RandomNumber", 0x31: "MBStringLength",
    0x32: "CharToAscii", 0x33: "AsciiToChar", 0x34: "GetTime", 0x35: "MBStringExtract",
    0x36: "MBCharToAscii", 0x37: "MBAsciiToChar", 0x3A: "Delete", 0x3B: "Delete2",
    0x3C: "DefineLocal", 0x3D: "CallFunction", 0x3E: "Return", 0x3F: "Modulo",
    0x40: "NewObject", 0x41: "DefineLocal2", 0x42: "InitArray", 0x43: "InitObject",
    0x44: "TypeOf", 0x45: "TargetPath", 0x46: "Enumerate", 0x47: "Add2",
    0x48: "Less2", 0x49: "Equals2", 0x4A: "ToNumber", 0x4B: "ToString",
    0x4C: "PushDuplicate", 0x4D: "StackSwap", 0x4E: "GetMember", 0x4F: "SetMember",
    0x50: "Increment", 0x51: "Decrement", 0x52: "CallMethod", 0x53: "NewMethod",
    0x54: "InstanceOf", 0x55: "Enumerate2", 0x60: "BitAnd", 0x61: "BitOr",
    0x62: "BitXor", 0x63: "BitLShift", 0x64: "BitRShift", 0x65: "BitURShift",
    0x66: "StrictEquals", 0x67: "Greater", 0x68: "StringGreater", 0x69: "Extends",
    0x81: "GotoFrame", 0x83: "GetURL", 0x87: "StoreRegister", 0x88: "ConstantPool",
    0x8A: "WaitForFrame", 0x8B: "SetTarget", 0x8C: "GoToLabel", 0x8D: "WaitForFrame2",
    0x8E: "DefineFunction2", 0x8F: "Try", 0x94: "With", 0x96: "Push", 0x99: "Jump",
    0x9A: "GetURL2", 0x9B: "DefineFunction", 0x9D: "If", 0x9E: "Call", 0x9F: "GotoFrame2",
}


def read_rect(data: bytes, pos: int) -> tuple[int, int]:
    nbits = data[pos] >> 3
    bits = 5 + 4 * nbits
    return (bits + 7) // 8, nbits


def extract_strings(payload: bytes) -> list[str]:
    return [chunk.decode("latin-1") for chunk in payload.split(b"\x00") if len(chunk) >= 2 and all(31 < b < 127 for b in chunk)]


def decode_push(payload: bytes) -> list[str]:
    values, pos = [], 0
    while pos < len(payload):
        item_type = payload[pos]
        pos += 1
        if item_type == 0:
            end = payload.find(b"\x00", pos)
            end = len(payload) if end == -1 else end
            values.append(repr(payload[pos:end].decode("latin-1", "replace")))
            pos = end + 1
        elif item_type == 1 and pos + 4 <= len(payload):
            values.append(str(struct.unpack_from("<f", payload, pos)[0]))
            pos += 4
        elif item_type == 2:
            values.append("null")
        elif item_type == 3:
            values.append("undefined")
        elif item_type == 4 and pos < len(payload):
            values.append(f"r{payload[pos]}")
            pos += 1
        elif item_type == 5 and pos < len(payload):
            values.append("true" if payload[pos] else "false")
            pos += 1
        elif item_type == 6 and pos + 8 <= len(payload):
            values.append(str(struct.unpack_from("<d", payload, pos)[0]))
            pos += 8
        elif item_type == 7 and pos + 4 <= len(payload):
            values.append(str(struct.unpack_from("<i", payload, pos)[0]))
            pos += 4
        elif item_type == 8 and pos < len(payload):
            values.append(f"const[{payload[pos]}]")
            pos += 1
        elif item_type == 9 and pos + 2 <= len(payload):
            values.append(f"const[{struct.unpack_from('<H', payload, pos)[0]}]")
            pos += 2
        else:
            values.append(f"type{item_type}?")
            break
    return values


def decode_actions(payload: bytes, depth: int = 0) -> list[str]:
    """Produce a conservative disassembly for AVM1 records without execution."""
    records, pos = [], 0
    while pos < len(payload):
        opcode = payload[pos]
        pos += 1
        if opcode == 0:
            records.append("EndAction")
            break
        length = 0
        if opcode >= 0x80:
            if pos + 2 > len(payload):
                break
            length = struct.unpack_from("<H", payload, pos)[0]
            pos += 2
        data = payload[pos:pos + length]
        pos += length
        name = ACTION_NAMES.get(opcode, f"Action_0x{opcode:02X}")
        indent = "  " * depth
        if opcode == 0x96:
            records.append(f"{indent}{name}({', '.join(decode_push(data))})")
        elif opcode == 0x88:
            records.append(f"{indent}{name}({', '.join(extract_strings(data))})")
        elif opcode in (0x99, 0x9D) and len(data) >= 2:
            records.append(f"{indent}{name}({struct.unpack_from('<h', data, 0)[0]:+d})")
        elif opcode == 0x9B:
            name_end = data.find(b"\x00")
            fn_name = data[:name_end].decode("latin-1", "replace") if name_end >= 0 else "?"
            cursor = name_end + 1
            if cursor + 2 <= len(data):
                param_count = struct.unpack_from("<H", data, cursor)[0]
                cursor += 2
                params = []
                for _ in range(param_count):
                    param_end = data.find(b"\x00", cursor)
                    if param_end == -1:
                        break
                    params.append(data[cursor:param_end].decode("latin-1", "replace"))
                    cursor = param_end + 1
                if cursor + 2 <= len(data):
                    body_size = struct.unpack_from("<H", data, cursor)[0]
                    cursor += 2
                    body = data[cursor:cursor + body_size]
                    records.append(f"{indent}{name}({fn_name}; params={params}) {{")
                    records.extend(decode_actions(body, depth + 1))
                    records.append(f"{indent}}}")
                else:
                    records.append(f"{indent}{name}({fn_name})")
            else:
                records.append(f"{indent}{name}({fn_name})")
        elif opcode == 0x8E:
            cursor = 0
            name_end = data.find(b"\x00", cursor)
            fn_name = data[:name_end].decode("latin-1", "replace") if name_end >= 0 else "?"
            cursor = name_end + 1
            if cursor + 3 <= len(data):
                param_count = struct.unpack_from("<H", data, cursor)[0]
                cursor += 3  # parameter count plus register count
                cursor += 2  # flags
                params = []
                for _ in range(param_count):
                    if cursor >= len(data):
                        break
                    register = data[cursor]
                    cursor += 1
                    param_end = data.find(b"\x00", cursor)
                    if param_end == -1:
                        break
                    params.append(f"r{register}:{data[cursor:param_end].decode('latin-1', 'replace')}")
                    cursor = param_end + 1
                if cursor + 2 <= len(data):
                    body_size = struct.unpack_from("<H", data, cursor)[0]
                    cursor += 2
                    records.append(f"{indent}{name}({fn_name}; params={params}) {{")
                    records.extend(decode_actions(data[cursor:cursor + body_size], depth + 1))
                    records.append(f"{indent}}}")
                else:
                    records.append(f"{indent}{name}({fn_name})")
            else:
                records.append(f"{indent}{name}({fn_name})")
        else:
            records.append(f"{indent}{name}" if not data else f"{indent}{name}[{len(data)}]")
    return records


def inspect(path: Path, out_dir: Path) -> dict:
    raw = path.read_bytes()
    if raw[:3] not in (b"FWS", b"CWS"):
        raise ValueError("Not an unencrypted FWS/CWS SWF file")
    version = raw[3]
    declared_length = struct.unpack_from("<I", raw, 4)[0]
    data = raw[:8] + (zlib.decompress(raw[8:]) if raw[:3] == b"CWS" else raw[8:])
    rect_bytes, rect_bits = read_rect(data, 8)
    pos = 8 + rect_bytes
    frame_rate_raw = struct.unpack_from("<H", data, pos)[0]
    frame_rate = frame_rate_raw >> 8
    frame_count = struct.unpack_from("<H", data, pos + 2)[0]
    pos += 4

    tags, extracted, string_hits, action_blocks = [], [], [], []
    counter = Counter()
    tag_index = 0
    out_dir.mkdir(parents=True, exist_ok=True)
    while pos + 2 <= len(data):
        header = struct.unpack_from("<H", data, pos)[0]
        pos += 2
        code, length = header >> 6, header & 0x3F
        if length == 0x3F:
            if pos + 4 > len(data):
                break
            length = struct.unpack_from("<I", data, pos)[0]
            pos += 4
        payload = data[pos:pos + length]
        pos += length
        tag_index += 1
        name = TAG_NAMES.get(code, f"Unknown_{code}")
        counter[name] += 1
        tags.append({"index": tag_index, "code": code, "name": name, "bytes": length})
        found = extract_strings(payload)
        if found:
            string_hits.extend({"tag": tag_index, "name": name, "text": text} for text in found)
        if code in (12, 59):
            action_blocks.append({"tag": tag_index, "name": name, "actions": decode_actions(payload)})

        if code == 21 and len(payload) > 2:
            char_id = struct.unpack_from("<H", payload, 0)[0]
            target = out_dir / f"image-{char_id}.jpg"
            target.write_bytes(payload[2:])
            extracted.append({"type": "jpeg2", "id": char_id, "path": str(target), "bytes": len(payload) - 2})
        elif code == 35 and len(payload) > 6:
            char_id, alpha_offset = struct.unpack_from("<HI", payload, 0)
            target = out_dir / f"image-{char_id}.jpg"
            target.write_bytes(payload[6:6 + alpha_offset])
            extracted.append({"type": "jpeg3", "id": char_id, "path": str(target), "bytes": alpha_offset})
        elif code == 14 and len(payload) > 7:
            char_id = struct.unpack_from("<H", payload, 0)[0]
            sound_info = payload[2]
            format_code = sound_info >> 4
            rate_code = (sound_info >> 2) & 0x03
            sample_size = (sound_info >> 1) & 0x01
            channels = (sound_info & 0x01) + 1
            sample_count = struct.unpack_from("<I", payload, 3)[0]
            sound_data = payload[7:]
            # Flash MP3 SoundData starts with a signed 16-bit SeekSamples field;
            # it is container metadata, not part of the MP3 bitstream.
            audio = sound_data[2:] if format_code == 2 and len(sound_data) >= 2 else sound_data
            extension = "mp3" if format_code == 2 else "bin"
            target = out_dir / f"sound-{char_id}.{extension}"
            target.write_bytes(audio)
            extracted.append({"type": "sound", "id": char_id, "format_code": format_code, "rate_code": rate_code, "sample_size_bits": 16 if sample_size else 8, "channels": channels, "sample_count": sample_count, "path": str(target), "bytes": len(audio)})
        if code == 0:
            break

    report = {
        "source": str(path), "signature": raw[:3].decode("ascii"), "version": version,
        "declared_length": declared_length, "decompressed_length": len(data), "rect_nbits": rect_bits,
        "frame_rate": frame_rate, "frame_count": frame_count, "tag_counts": dict(counter),
        "tags": tags, "printable_strings": string_hits[:300], "action_blocks": action_blocks, "extracted": extracted,
    }
    return report


if __name__ == "__main__":
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    report = inspect(source, destination)
    print(json.dumps(report, ensure_ascii=False, indent=2))
