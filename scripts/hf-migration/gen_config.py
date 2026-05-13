#!/usr/bin/env python3
"""Emit `config.json` per (target_repo, backend) from mapping.yaml.

Groups every non-null mapping entry by `(target_repo, target_backend)` and
writes a config.json that conforms to the schema published at
`software-mansion/react-native-executorch-spec`.

Heuristics fill in the structural fields automatically:

- `model`, `family`           — from REPO_META in generate_mapping.py
- `backend`, `variants[].file`, `variants[].precision`, `variants[].quantized`
                              — parsed from the new filename
- `variants[].default`        — auto-picked (lowest-precision non-quant,
                                first quantized) but reviewable in the YAML
- `capabilities`              — best-effort from family
- `license`                   — `TODO_license` (human-filled per repo)
- `size_bytes`                — populated when --query-hf is passed
- `methods`                   — `TODO_methods` (requires .pte introspection;
                                left for a follow-up that depends on the
                                `executorch` Python package)

Output structure (one file per pair):

    scripts/hf-migration/configs/<target_repo>/<backend>/config.json

The migration runner (migrate.py, follow-up) consumes these files and
uploads them as part of the per-repo restructuring commit.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib
import re
import sys
from collections import defaultdict
from typing import Any, Optional

HERE = pathlib.Path(__file__).parent
SPEC_SCHEMA_URL = (
    "https://huggingface.co/software-mansion/react-native-executorch-spec/"
    "resolve/main/config.schema.json"
)

QUANTIZED_PRECISIONS = {"int8", "4w", "a8w8", "8da4w", "spinquant", "qat_lora"}
NON_QUANTIZED_PRECISIONS = {"fp32", "fp16", "bf16"}
ALL_PRECISIONS = QUANTIZED_PRECISIONS | NON_QUANTIZED_PRECISIONS

# Reuse REPO_META and BACKENDS from the mapping generator so we have a
# single source of truth.
_spec = importlib.util.spec_from_file_location(
    "generate_mapping", HERE / "generate_mapping.py"
)
_gm = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
assert _spec and _spec.loader
_spec.loader.exec_module(_gm)  # type: ignore[union-attr]
REPO_META: dict[str, dict[str, str]] = _gm.REPO_META
BACKENDS: tuple[str, ...] = _gm.BACKENDS

# Family → capabilities. Multi-modal models list more than one.
FAMILY_CAPABILITIES: dict[str, list[str]] = {
    "llama": ["text-generation"],
    "qwen": ["text-generation"],
    "smollm": ["text-generation"],
    "hammer": ["text-generation"],
    "phi": ["text-generation"],
    "lfm": ["text-generation"],
    "bielik": ["text-generation"],
    "efficientnet": ["classification"],
    "ssdlite": ["object-detection"],
    "rfdetr": ["object-detection", "instance-segmentation"],
    "yolo": ["object-detection", "instance-segmentation"],
    "sam": ["instance-segmentation"],
    "style_transfer": ["style-transfer"],
    "whisper": ["speech-to-text"],
    "deeplab": ["semantic-segmentation"],
    "lraspp": ["semantic-segmentation"],
    "fcn": ["semantic-segmentation"],
    "selfie": ["semantic-segmentation"],
    "sbert": ["text-embedding"],
    "clip": ["text-embedding", "image-embedding"],
    "bk_sdm": ["image-generation"],
    "fsmn": ["voice-activity-detection"],
    "privacy_filter": ["classification"],
}

# Family-level default-quantized preference. Within the quantized variants
# of a backend, the first matching precision is picked as the default.
DEFAULT_QUANTIZED_PRIORITY: dict[str, list[str]] = {
    "llama": ["spinquant", "8da4w", "qat_lora", "int8"],
    "qwen": ["8da4w", "int8"],
    "smollm": ["8da4w", "int8"],
    "hammer": ["8da4w", "int8"],
    "phi": ["8da4w", "int8"],
    "lfm": ["8da4w", "int8"],
    "bielik": ["8da4w", "int8"],
    "sbert": ["8da4w", "int8"],
    "clip": ["int8", "8da4w"],
    # All vision / generation / audio models default to int8 when quantized.
}
DEFAULT_QUANTIZED_FALLBACK = ["int8", "8da4w", "4w", "a8w8", "spinquant", "qat_lora"]

# Family-level default-non-quantized preference. fp32 is widest support;
# fp16 is the modern default for CoreML and many XNNPACK exports.
DEFAULT_NON_QUANTIZED_PRIORITY: dict[str, list[str]] = {
    "llama": ["bf16", "fp16", "fp32"],
    "qwen": ["bf16", "fp16", "fp32"],
    "smollm": ["bf16", "fp16", "fp32"],
    "hammer": ["bf16", "fp16", "fp32"],
    "phi": ["bf16", "fp16", "fp32"],
    "lfm": ["fp16", "bf16", "fp32"],
    "bielik": ["fp16", "bf16", "fp32"],
}
DEFAULT_NON_QUANTIZED_FALLBACK = ["fp32", "fp16", "bf16"]


def parse_filename(filename: str) -> dict[str, str | None]:
    """Extract (backend, precision) from a `<...>_<backend>_<precision>.pte` name."""
    stem = filename.removesuffix(".pte")
    parts = stem.split("_")
    backend = next((b for b in parts if b in BACKENDS), None)
    precision = next((p for p in parts if p in ALL_PRECISIONS), None)
    return {"backend": backend, "precision": precision}


def pick_default(variants: list[dict], family: str, quantized: bool) -> int | None:
    """Return the index of the variant that should be marked default."""
    candidates = [
        (i, v["precision"]) for i, v in enumerate(variants) if v["quantized"] == quantized
    ]
    if not candidates:
        return None
    priority = (
        DEFAULT_QUANTIZED_PRIORITY.get(family, DEFAULT_QUANTIZED_FALLBACK)
        if quantized
        else DEFAULT_NON_QUANTIZED_PRIORITY.get(family, DEFAULT_NON_QUANTIZED_FALLBACK)
    )
    for p in priority:
        for idx, prec in candidates:
            if prec == p:
                return idx
    return candidates[0][0]


def build_config(repo_short: str, backend: str, files: list[dict]) -> dict[str, Any]:
    suffix = repo_short.removeprefix("react-native-executorch-")
    meta = REPO_META.get(suffix, {})
    model = meta.get("model", f"TODO_unknown_model_{suffix}")
    family = meta.get("family", "TODO_unknown_family")
    multi_component = bool(meta.get("multi_component"))
    capabilities = FAMILY_CAPABILITIES.get(family, ["TODO_capabilities"])

    # Build size from the filename pattern: <model>_<size?>_<backend>_<prec>.pte
    # For multi-component repos, the token between model and backend is a
    # component name, not a size — skip size derivation and let the reviewer
    # collapse the variants into a `components` block per MODEL_SPEC.md §4.
    sizes_seen: set[str] = set()
    variants: list[dict[str, Any]] = []
    for entry in files:
        target = entry["target"]
        filename = target.rsplit("/", 1)[-1]
        parsed = parse_filename(filename)
        precision = parsed["precision"] or "TODO_precision"
        quantized = precision in QUANTIZED_PRECISIONS
        if not multi_component:
            stem = filename.removesuffix(".pte")
            match = re.match(rf"^{re.escape(model)}_(.*?)_{re.escape(backend)}_", stem)
            size = match.group(1) if match else None
            if size:
                sizes_seen.add(size)
        variants.append(
            {
                "file": filename,
                "precision": precision,
                "quantized": quantized,
                "default": False,
                "methods": {"TODO_methods": "introspect .pte to fill"},
            }
        )

    if multi_component:
        size_field = None
    elif len(sizes_seen) == 1:
        size_field = next(iter(sizes_seen))
    elif len(sizes_seen) == 0:
        size_field = None
    else:
        # Shouldn't happen now that generate_mapping.py splits multi-size
        # repos into per-size subdirs; left as a fallback marker.
        size_field = f"TODO_multiple_sizes_{sorted(sizes_seen)}"

    non_quant_default = pick_default(variants, family, quantized=False)
    if non_quant_default is not None:
        variants[non_quant_default]["default"] = True
    quant_default = pick_default(variants, family, quantized=True)
    if quant_default is not None:
        variants[quant_default]["default"] = True

    config: dict[str, Any] = {
        "$schema": SPEC_SCHEMA_URL,
        "model": model,
        "family": family,
        "capabilities": capabilities,
        "backend": backend,
        "license": "TODO_license",
        "variants": variants,
    }
    if size_field is not None:
        config["size"] = size_field
        config = {"$schema": config.pop("$schema"), **config}  # keep $schema first
    return config


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mapping",
        type=pathlib.Path,
        default=HERE / "mapping.yaml",
    )
    parser.add_argument("--draft", action="store_true", help="Use mapping.draft.yaml.")
    parser.add_argument(
        "--out",
        type=pathlib.Path,
        default=HERE / "configs",
        help="Output directory (default: scripts/hf-migration/configs).",
    )
    args = parser.parse_args()

    if args.draft:
        args.mapping = HERE / "mapping.draft.yaml"
    if not args.mapping.exists():
        print(f"mapping file missing: {args.mapping}", file=sys.stderr)
        return 2

    # Lazily reuse migrate.py's YAML parser to keep the dependency story
    # consistent (no PyYAML required).
    _migrate = HERE / "migrate.py"
    spec = importlib.util.spec_from_file_location("migrate", _migrate)
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    assert spec and spec.loader
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    mapping = mod.parse_yaml(args.mapping.read_text())

    # Group by (target_repo, size_dir, target_backend). `size_dir` is None
    # for single-size repos (files live directly under `<backend>/`).
    grouped: dict[tuple[str, Optional[str], str], list[dict]] = defaultdict(list)
    for repo_short, body in mapping["repos"].items():
        for entry in body["files"]:
            tgt = entry["target"]
            if tgt is None or "/" not in tgt or not tgt.endswith(".pte"):
                continue
            parts = tgt.split("/")
            if parts[0] in BACKENDS:
                size_dir = None
                backend = parts[0]
            elif len(parts) >= 2 and parts[1] in BACKENDS:
                size_dir = parts[0]
                backend = parts[1]
            else:
                continue
            grouped[(repo_short, size_dir, backend)].append(entry)

    args.out.mkdir(parents=True, exist_ok=True)
    written = 0
    for (repo_short, size_dir, backend), files in sorted(grouped.items()):
        config = build_config(repo_short, backend, files)
        rel_parent = pathlib.Path(repo_short)
        if size_dir is not None:
            rel_parent = rel_parent / size_dir
        out_path = args.out / rel_parent / backend / "config.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(config, indent=2) + "\n")
        written += 1
        print(f"wrote {out_path.relative_to(HERE.parent.parent)}", file=sys.stderr)

    print(f"\ngenerated {written} config.json files", file=sys.stderr)
    print(
        "TODO_license and TODO_methods fields must be filled before migrate.py runs.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
