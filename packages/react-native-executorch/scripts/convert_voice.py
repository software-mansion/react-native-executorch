#!/usr/bin/env python3
"""Convert a Supertonic voice-style JSON into the flat binary the C++ pipeline
(and HF-hosted assets) expect.

Input : a voice_styles/*.json file with ``style_ttl`` [1,50,256] and
        ``style_dp`` [1,8,16] (each ``{dims, data}``).
Output: a little-endian float32 blob — 12800 ttl floats then 128 dp floats
        (see supertonic/Types.h::Voice and Supertonic::loadVoice).

Usage:
    python scripts/convert_voice.py voice_styles/M1.json out/M1.bin
    python scripts/convert_voice.py --all voice_styles out/voices
"""

import argparse
import json
from pathlib import Path

import numpy as np

TTL_SIZE = 50 * 256
DP_SIZE = 8 * 16


def _flat(entry, expected):
    arr = np.array(entry["data"], dtype=np.float32).reshape(-1)
    if arr.size != expected:
        raise ValueError(f"expected {expected} floats, got {arr.size}")
    return arr


def convert_one(json_path: Path, out_path: Path) -> None:
    data = json.loads(json_path.read_text())
    ttl = _flat(data["style_ttl"], TTL_SIZE)
    dp = _flat(data["style_dp"], DP_SIZE)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(ttl.tobytes())
        f.write(dp.tobytes())
    print(f"{json_path.name} -> {out_path} ({out_path.stat().st_size} bytes)")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--all", action="store_true",
                   help="convert every *.json in the input directory")
    p.add_argument("src", help="voice JSON file, or directory when --all")
    p.add_argument("dst", help="output .bin file, or directory when --all")
    args = p.parse_args()

    if args.all:
        src_dir, dst_dir = Path(args.src), Path(args.dst)
        for jp in sorted(src_dir.glob("*.json")):
            convert_one(jp, dst_dir / f"{jp.stem}.bin")
    else:
        convert_one(Path(args.src), Path(args.dst))


if __name__ == "__main__":
    main()
