#!/usr/bin/env python3
"""Generate a draft mapping.yaml from refs.json + inventory.json.

The output is a starting point for human review, not a complete migration
script. Each reference in refs.json is transformed via best-effort heuristics
into a new path that matches MODEL_SPEC.md §3. Cases the heuristics cannot
resolve are emitted as `target: TODO_*`. The reviewer corrects them by hand
before running migrate.py.

Reads:
- scripts/hf-migration/refs.json       (from parse_modelurls.py)
- scripts/hf-migration/inventory.json  (from inventory.py)
Writes:
- scripts/hf-migration/mapping.draft.yaml

Run after refs.json or inventory.json has been refreshed.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
from collections import defaultdict
from typing import Optional

HERE = pathlib.Path(__file__).parent
REFS = HERE / "refs.json"
INVENTORY = HERE / "inventory.json"
OUT = HERE / "mapping.draft.yaml"

QUANTIZED_PRECISIONS = {"int8", "4w", "a8w8", "8da4w", "spinquant", "qat_lora"}
NON_QUANTIZED_PRECISIONS = {"fp32", "fp16", "bf16"}
ALL_PRECISIONS = QUANTIZED_PRECISIONS | NON_QUANTIZED_PRECISIONS
BACKENDS = ("xnnpack", "coreml", "vulkan", "qnn")

# Filename precision typos fixed during migration. Confirmed with the user
# before adding here. The .pte content is unchanged; only the filename is
# corrected so it parses cleanly per spec §3.
PRECISION_TYPOS: dict[str, str] = {
    "8w4da": "8da4w",  # lfm2.5-350M; rest of the codebase uses 8da4w
}

# Repos consolidated into another repo per MODEL_SPEC.md §7.3.
CONSOLIDATE: dict[str, str] = {
    "react-native-executorch-whisper-tiny-quantized.en":  "react-native-executorch-whisper-tiny.en",
    "react-native-executorch-whisper-base-quantized.en":  "react-native-executorch-whisper-base.en",
    "react-native-executorch-whisper-small-quantized.en": "react-native-executorch-whisper-small.en",
}

# Llama QLoRA — dropped per MODEL_SPEC.md §7.2. Detected by path substring;
# emits target=null so the migrator leaves the file untouched.
DROP_PATTERNS: list[str] = ["/QLoRA/", "qat_lora"]

# Maps an HF repo suffix to model metadata for filename construction.
# `model` is lowercased and uses `_` per spec §3.
# `default_backend` / `default_precision` fill in when the path doesn't
# encode them explicitly (e.g. legacy LLM paths use `original/`+`quantized/`
# instead of `<backend>/`).
REPO_META: dict[str, dict[str, str]] = {
    # LLMs — all XNNPACK; precision usually present in filename.
    "llama-3.2":                                    {"model": "llama_3_2", "family": "llama", "default_backend": "xnnpack"},
    "qwen-2.5":                                     {"model": "qwen_2_5", "family": "qwen", "default_backend": "xnnpack"},
    "qwen-3":                                       {"model": "qwen_3", "family": "qwen", "default_backend": "xnnpack"},
    "qwen-3.5":                                     {"model": "qwen_3_5", "family": "qwen", "default_backend": "xnnpack"},
    "smolLm-2":                                     {"model": "smollm2", "family": "smollm", "default_backend": "xnnpack"},
    "hammer-2.1":                                   {"model": "hammer_2_1", "family": "hammer", "default_backend": "xnnpack"},
    "phi-4-mini":                                   {"model": "phi_4_mini", "family": "phi", "default_backend": "xnnpack"},
    "lfm-2.5":                                      {"model": "lfm_2_5", "family": "lfm", "default_backend": "xnnpack"},
    "bielik-v3.0":                                  {"model": "bielik_v3_0", "family": "bielik", "default_backend": "xnnpack"},
    # Vision / classification
    "efficientnet-v2-s":                            {"model": "efficientnet_v2_s", "family": "efficientnet"},
    "ssdlite320-mobilenet-v3-large":                {"model": "ssdlite320_mobilenet_v3_large", "family": "ssdlite"},
    "rfdetr-nano-detector":                         {"model": "rfdetr_nano", "family": "rfdetr", "default_backend": "xnnpack", "default_precision": "fp32"},
    "rfdetr-nano-segmentation":                     {"model": "rfdetr_nano", "family": "rfdetr", "default_backend": "xnnpack", "default_precision": "fp32"},
    "yolo26":                                       {"model": "yolo26", "family": "yolo", "default_backend": "xnnpack", "default_precision": "fp32"},
    "yolo26-seg":                                   {"model": "yolo26_seg", "family": "yolo", "default_backend": "xnnpack", "default_precision": "fp32"},
    "yolo26-pose":                                  {"model": "yolo26_pose", "family": "yolo", "default_backend": "xnnpack", "default_precision": "fp32"},
    "fast-sam":                                     {"model": "fast_sam", "family": "sam"},
    # Style transfer
    "style-transfer-candy":                         {"model": "style_transfer_candy", "family": "style_transfer"},
    "style-transfer-mosaic":                        {"model": "style_transfer_mosaic", "family": "style_transfer"},
    "style-transfer-rain-princess":                 {"model": "style_transfer_rain_princess", "family": "style_transfer"},
    "style-transfer-udnie":                         {"model": "style_transfer_udnie", "family": "style_transfer"},
    # Speech to text — XNNPACK only; quantized variants are int8.
    "whisper-tiny":                                 {"model": "whisper_tiny", "family": "whisper", "default_backend": "xnnpack", "default_precision": "fp32"},
    "whisper-base":                                 {"model": "whisper_base", "family": "whisper", "default_backend": "xnnpack", "default_precision": "fp32"},
    "whisper-small":                                {"model": "whisper_small", "family": "whisper", "default_backend": "xnnpack", "default_precision": "fp32"},
    "whisper-tiny.en":                              {"model": "whisper_tiny_en", "family": "whisper", "default_backend": "xnnpack", "default_precision": "fp32"},
    "whisper-base.en":                              {"model": "whisper_base_en", "family": "whisper", "default_backend": "xnnpack", "default_precision": "fp32"},
    "whisper-small.en":                             {"model": "whisper_small_en", "family": "whisper", "default_backend": "xnnpack", "default_precision": "fp32"},
    "whisper-tiny-quantized.en":                    {"model": "whisper_tiny_en", "family": "whisper", "default_backend": "xnnpack", "default_precision": "int8"},
    "whisper-base-quantized.en":                    {"model": "whisper_base_en", "family": "whisper", "default_backend": "xnnpack", "default_precision": "int8"},
    "whisper-small-quantized.en":                   {"model": "whisper_small_en", "family": "whisper", "default_backend": "xnnpack", "default_precision": "int8"},
    # Segmentation
    "deeplab-v3":                                   {"model": "deeplab_v3", "family": "deeplab"},
    "lraspp":                                       {"model": "lraspp_mobilenet_v3_large", "family": "lraspp"},
    "fcn":                                          {"model": "fcn", "family": "fcn"},
    "selfie-segmentation":                          {"model": "selfie_segmentation", "family": "selfie", "default_backend": "xnnpack", "default_precision": "fp32"},
    # Embeddings — XNNPACK only at fp32 unless filename says otherwise.
    "all-MiniLM-L6-v2":                             {"model": "all_minilm_l6_v2", "family": "sbert", "default_backend": "xnnpack", "default_precision": "fp32"},
    "all-mpnet-base-v2":                            {"model": "all_mpnet_base_v2", "family": "sbert", "default_backend": "xnnpack", "default_precision": "fp32"},
    "multi-qa-MiniLM-L6-cos-v1":                    {"model": "multi_qa_minilm_l6_cos_v1", "family": "sbert", "default_backend": "xnnpack", "default_precision": "fp32"},
    "multi-qa-mpnet-base-dot-v1":                   {"model": "multi_qa_mpnet_base_dot_v1", "family": "sbert", "default_backend": "xnnpack", "default_precision": "fp32"},
    "distiluse-base-multilingual-cased-v2":         {"model": "distiluse_base_multilingual_cased_v2", "family": "sbert"},
    "paraphrase-multilingual-MiniLM-L12-v2":        {"model": "paraphrase_multilingual_minilm_l12_v2", "family": "sbert"},
    "clip-vit-base-patch32":                        {"model": "clip_vit_base_patch32", "family": "clip", "default_backend": "xnnpack", "default_precision": "fp32"},
    # Image generation — multi-component; see BK_SDM_COMPONENT routing below.
    "bk-sdm-tiny":                                  {"model": "bk_sdm_tiny", "family": "bk_sdm", "default_backend": "xnnpack", "default_precision": "fp32", "multi_component": "true"},
    "fsmn-vad":                                     {"model": "fsmn_vad", "family": "fsmn", "default_backend": "xnnpack", "default_precision": "fp32"},
    "privacy-filter-nemotron":                      {"model": "privacy_filter_nemotron", "family": "privacy_filter", "default_backend": "xnnpack", "default_precision": "fp32"},
    "privacy-filter-openai":                        {"model": "privacy_filter_openai", "family": "privacy_filter", "default_backend": "xnnpack", "default_precision": "fp32"},
    # OCR
    "detector-craft":                               {"model": "craft", "family": "craft", "default_backend": "xnnpack"},
    "recognizer-crnn.en":                           {"model": "crnn", "family": "crnn", "default_backend": "xnnpack", "default_precision": "fp32"},
    # TTS
    "kokoro":                                       {"model": "kokoro", "family": "kokoro", "default_backend": "xnnpack", "default_precision": "fp32", "multi_component": "true"},
}

# Top-level dir (in current HF layout) → component token (in new filename).
# BK-SDM stores each component as `<dir>/model.pte` (or model.256.pte for the
# 256x256 unet/vae). The new filename embeds the component per spec §3.
BK_SDM_COMPONENT_DIRS = {"text_encoder", "unet", "vae"}


def repo_suffix(repo: str) -> str:
    return repo.removeprefix("react-native-executorch-")


def detect_backend(path: str, filename: str) -> Optional[str]:
    """Pick a backend from the path (preferred) or the filename."""
    for b in BACKENDS:
        if f"/{b}/" in f"/{path}" or path.startswith(f"{b}/"):
            return b
    for b in BACKENDS:
        if b in filename.lower():
            return b
    return None


def detect_precision(filename: str) -> Optional[str]:
    """Pick the longest-matching precision token from the filename."""
    stem = filename.removesuffix(".pte").lower()
    for typo, fixed in PRECISION_TYPOS.items():
        if re.search(rf"(^|[_\.]){re.escape(typo)}($|[_\.])", stem):
            return fixed
    for p in sorted(ALL_PRECISIONS, key=len, reverse=True):
        # Token boundary: bracketed by `_`, `.`, or start/end.
        if re.search(rf"(^|[_\.]){re.escape(p)}($|[_\.])", stem):
            return p
    return None


def detect_size(path: str, filename: str) -> Optional[str]:
    """Pick a size token (1b, 3b, 135m, n/s/m/l/x for yolo, etc.)."""
    # Try the path first; it often has the canonical size dir (e.g. `llama-3.2-3B/`).
    for source in (path, filename):
        # parameter-count form: 0.5B, 1.5B, 1.7B, 135M, 360M, 1B, 3B, 4B
        m = re.search(r"\b(\d+(?:[._]\d+)?)\s*([BMm])\b", source)
        if m:
            num = m.group(1).replace(".", "_").replace("_", "_")
            unit = m.group(2).lower()
            return f"{num}{unit}"
        # YOLO single-letter sizes: yolo26n, yolo26s, ...
        m = re.search(r"yolo26([nsmlx])", source.lower())
        if m:
            return m.group(1)
    return None


def is_tokenizer(path: str) -> bool:
    base = path.rsplit("/", 1)[-1]
    return base in {"tokenizer.json", "tokenizer_config.json", "scheduler_config.json"}


# Top-level directories whose contents are runtime-loaded assets (voices,
# phonemizer data, etc.) and stay in place across the migration.
KEPT_ASSET_PREFIXES = ("voices/", "phonemizer/", "scheduler/", "tokenizer/")


def propose_kokoro(path: str) -> tuple[Optional[str], str]:
    # Asset directories (phonemizer/, voices/, etc.) stay in place.
    if any(path.startswith(p) for p in KEPT_ASSET_PREFIXES):
        return path, "kokoro shared asset — kept at repo root"
    # .pte path is `xnnpack/<size>/<component>.pte`. Return FLAT target;
    # main()'s multi-size rewrite prepends `<size>/`.
    parts = path.split("/")
    if len(parts) == 3 and parts[0] == "xnnpack" and parts[2].endswith(".pte"):
        size = parts[1]
        component = parts[2].removesuffix(".pte")
        new_name = f"kokoro_{size}_{component}_xnnpack_fp32.pte"
        return f"xnnpack/{new_name}", "kokoro multi-size + multi-component"
    return f"TODO_kokoro_unknown:{path}", "unrecognised kokoro path shape"


def propose_recognizer_crnn(path: str) -> tuple[Optional[str], str]:
    # Source: `xnnpack/<lang>/xnnpack_crnn_<lang>.pte`. Return FLAT target;
    # main()'s multi-size rewrite prepends `<lang>/`.
    parts = path.split("/")
    if len(parts) == 3 and parts[0] == "xnnpack" and parts[2].endswith(".pte"):
        lang = parts[1]
        new_name = f"crnn_{lang}_xnnpack_fp32.pte"
        return f"xnnpack/{new_name}", f"recognizer-crnn language={lang}"
    return f"TODO_crnn_unknown:{path}", "unrecognised crnn path shape"


def propose_detector_craft(path: str) -> tuple[Optional[str], str]:
    # Source: `xnnpack_quantized/xnnpack_craft_quantized.pte`
    if path.endswith(".pte"):
        # The library only references the quantized variant. Precision token
        # is `int8` per the model's published quantization scheme (PTQ int8).
        return "xnnpack/craft_xnnpack_int8.pte", "detector-craft quantized"
    return f"TODO_craft_unknown:{path}", "unrecognised craft path shape"


SPECIAL_CASE_HANDLERS = {
    "kokoro": propose_kokoro,
    "recognizer-crnn.en": propose_recognizer_crnn,
    "detector-craft": propose_detector_craft,
}


def propose_target(repo: str, path: str) -> tuple[Optional[str], str]:
    """Return (target_path_in_target_repo, reason). target=None means drop."""
    for marker in DROP_PATTERNS:
        if marker in path:
            return None, "dropped per MODEL_SPEC.md §7.2 (Llama QLoRA)"

    if is_tokenizer(path):
        # Top-level shared assets stay at the repo root.
        return path, "tokenizer/config — kept at repo root unchanged"

    suffix = repo_suffix(repo)
    if suffix in SPECIAL_CASE_HANDLERS:
        return SPECIAL_CASE_HANDLERS[suffix](path)

    meta = REPO_META.get(suffix)
    if meta is None:
        return f"TODO_unknown_repo:{path}", f"no REPO_META entry for {suffix!r}"

    model = meta["model"]
    filename = path.rsplit("/", 1)[-1]

    # Multi-component BK-SDM: route by top-level dir to a component token.
    if suffix == "bk-sdm-tiny":
        top = path.split("/", 1)[0]
        if top in BK_SDM_COMPONENT_DIRS:
            component = top
            backend = meta.get("default_backend", "xnnpack")
            precision = detect_precision(filename) or meta.get("default_precision", "fp32")
            # Distinguish the two unet/vae resolutions: `model.256.pte` vs `model.pte` (512).
            resolution_suffix = "_256" if filename.endswith(".256.pte") else ""
            new_filename = f"{model}_{component}{resolution_suffix}_{backend}_{precision}.pte"
            return f"{backend}/{new_filename}", f"bk-sdm component={component}"

    backend = detect_backend(path, filename) or meta.get("default_backend")
    if backend is None:
        return f"TODO_no_backend:{path}", "could not detect backend"

    precision = detect_precision(filename) or meta.get("default_precision")
    if precision is None:
        return f"TODO_no_precision:{path}", "could not detect precision token"

    size = detect_size(path, filename)

    parts = [model]
    if size:
        parts.append(size)
    parts.extend([backend, precision])
    new_filename = "_".join(parts) + ".pte"
    return f"{backend}/{new_filename}", "heuristic"


def dump_yaml(data: dict) -> str:
    """Tiny hand-rolled YAML dumper so the script has no third-party deps.

    Handles the exact shape produced below; not a general-purpose dumper.
    """
    lines: list[str] = []

    def emit_scalar(v):
        if v is None:
            return "null"
        if isinstance(v, bool):
            return "true" if v else "false"
        s = str(v)
        if re.search(r"[:#\[\]{},&*!|>'\"%@`]|^-|^\s|\s$", s):
            return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
        return s

    def emit(value, indent: int):
        pad = "  " * indent
        if isinstance(value, dict):
            for k, v in value.items():
                if isinstance(v, (dict, list)):
                    lines.append(f"{pad}{k}:")
                    emit(v, indent + 1)
                else:
                    lines.append(f"{pad}{k}: {emit_scalar(v)}")
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    first = True
                    for k, v in item.items():
                        prefix = f"{pad}- " if first else f"{pad}  "
                        if isinstance(v, (dict, list)):
                            lines.append(f"{prefix}{k}:")
                            emit(v, indent + 2)
                        else:
                            lines.append(f"{prefix}{k}: {emit_scalar(v)}")
                        first = False
                else:
                    lines.append(f"{pad}- {emit_scalar(item)}")

    emit(data, 0)
    return "\n".join(lines) + "\n"


def parse_size_from_target(target: Optional[str], repo_suffix: str) -> Optional[str]:
    """Extract the size token from a proposed target path's filename.

    Filenames have the shape `<model>[_<size>]_<backend>_<precision>.pte` and
    the size can contain internal underscores (e.g. `0_5b`). We use the known
    model prefix from REPO_META to find where size starts, and the known
    backend list to find where it ends.
    """
    if target is None or "/" not in target or not target.endswith(".pte"):
        return None
    meta = REPO_META.get(repo_suffix)
    if not meta:
        return None
    if repo_suffix == "kokoro":
        # Filename: kokoro_<size>_<component>_xnnpack_<precision>.pte
        filename = target.rsplit("/", 1)[-1].removesuffix(".pte")
        parts = filename.split("_")
        if len(parts) >= 4 and parts[0] == "kokoro" and parts[1] in {"small", "medium"}:
            return parts[1]
        return None
    if repo_suffix == "recognizer-crnn.en":
        # Filename: crnn_<lang>_xnnpack_<precision>.pte
        filename = target.rsplit("/", 1)[-1].removesuffix(".pte")
        parts = filename.split("_")
        if len(parts) >= 4 and parts[0] == "crnn" and parts[-2] == "xnnpack":
            return "_".join(parts[1:-2])
        return None
    if meta.get("multi_component"):
        # The token between model and backend is a component, not a size.
        return None
    model = meta["model"]
    stem = target.rsplit("/", 1)[-1].removesuffix(".pte")
    if not stem.startswith(model + "_"):
        return None
    rest = stem[len(model) + 1 :]
    for b in BACKENDS:
        marker = f"_{b}_"
        idx = rest.find(marker)
        if idx >= 0:
            size = rest[:idx]
            return size or None
        if rest.startswith(f"{b}_"):
            # No size token — backend follows model directly.
            return None
    return None


def rewrite_target_for_multisize(target: str, size: str) -> str:
    """Prepend `<size>/` to a target path under a backend directory."""
    backend, _, rest = target.partition("/")
    return f"{size}/{backend}/{rest}"


def main() -> int:
    refs = json.loads(REFS.read_text())["refs"]
    inv = json.loads(INVENTORY.read_text())

    # First pass: propose targets and remember the size for each entry.
    proposed: list[dict] = []
    for ref in refs:
        src_repo = ref["repo"]
        target_repo = CONSOLIDATE.get(src_repo, src_repo)
        target, reason = propose_target(src_repo, ref["path"])
        proposed.append(
            {
                "src_repo": src_repo,
                "target_repo": target_repo,
                "source_tag": ref["tag"],
                "source_path": ref["path"],
                "target": target,
                "note": reason,
                "size": parse_size_from_target(target, repo_suffix(src_repo)),
            }
        )

    # Per target_repo, figure out how many distinct sizes are present.
    sizes_per_repo: dict[str, set[str]] = defaultdict(set)
    for p in proposed:
        if p["size"]:
            sizes_per_repo[p["target_repo"]].add(p["size"])

    # Second pass: rewrite multi-size repos to prepend `<size>/`.
    by_target_repo: dict[str, list[dict]] = defaultdict(list)
    todo_count = drop_count = ok_count = 0
    for p in proposed:
        target = p["target"]
        size = p["size"]
        sizes = sizes_per_repo[p["target_repo"]]
        if target is not None and not target.startswith("TODO_") and size and len(sizes) > 1:
            target = rewrite_target_for_multisize(target, size)
        if target is None:
            drop_count += 1
        elif isinstance(target, str) and target.startswith("TODO_"):
            todo_count += 1
        else:
            ok_count += 1
        by_target_repo[p["target_repo"]].append(
            {
                "source_repo": p["src_repo"],
                "source_tag": p["source_tag"],
                "source_path": p["source_path"],
                "target": target,
                "note": p["note"],
            }
        )

    out: dict = {
        "target_tag": "v0.9.0",
        "generated_from": {
            "refs": "scripts/hf-migration/refs.json",
            "inventory": "scripts/hf-migration/inventory.json",
        },
        "stats": {"ok": ok_count, "todo": todo_count, "dropped": drop_count, "total": len(refs)},
        "repos": {
            repo: {"files": sorted(files, key=lambda e: (e["source_repo"], e["source_path"]))}
            for repo, files in sorted(by_target_repo.items())
        },
    }
    OUT.write_text(dump_yaml(out))

    print(
        f"stats: ok={ok_count}  todo={todo_count}  dropped={drop_count}  total={len(refs)}",
        file=sys.stderr,
    )
    print(f"wrote {OUT}", file=sys.stderr)
    if todo_count:
        print(
            f"\n{todo_count} entries need human review (search for `TODO_` in the YAML).",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
