#!/usr/bin/env python3
"""Delete stale `config.json` files left on `main` after migrate.py ran.

After migrate.py renames `.pte` files into the new MODEL_SPEC.md §2 layout,
the old per-variant directories (e.g. `llama-3.2-1B/original/`) still hold
auxiliary `config.json` files that the migrator didn't move. Those files
describe the prior layout and don't fit the new convention; the
spec-compliant `config.json` files emitted by gen_config.py will be
uploaded in a separate step.

This script deletes **only files named `config.json`** anywhere in the
target repo (excluding any that the mapping explicitly marks as kept —
none today, but the check stays for safety). Everything else stays:

- Non-config files unreferenced by modelUrls.ts (e.g. `_vl_*.pte`,
  `coreml/*_fp32.pte`, `viterbi_calibration.json`) — these are
  intentional repo content awaiting future library wiring.
- Companion HF files like `tokenizer_config.json`.
- Repo metadata (`README.md`, `LICENSE`, `.gitattributes`).

Historical tags (`v0.8.0` …) keep pointing at the pre-migration state,
so any URL pinned to a prior release continues to resolve.

Run with `--dry-run` first. `--repo <name>` restricts to one repo.
"""

from __future__ import annotations

import argparse
import importlib.util
import pathlib
import sys
from collections import defaultdict
from typing import Any

from huggingface_hub import CommitOperationDelete, HfApi

ORG = "software-mansion"
HERE = pathlib.Path(__file__).parent

ALWAYS_KEEP_BASENAMES = {"README.md", "LICENSE", ".gitattributes"}


def load_mapping(path: pathlib.Path) -> Any:
    spec = importlib.util.spec_from_file_location("migrate", HERE / "migrate.py")
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    assert spec and spec.loader
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod.parse_yaml(path.read_text())


def keep_set_for(repo: str, mapping: dict) -> set[str]:
    """Collect paths that must remain on `main` for `repo`.

    Mapping is keyed by *target* repo, so every entry's `target` ends up in
    `repo`'s main regardless of whether it came from this same repo
    (rename) or a different one (cross-repo consolidation).
    """
    keep: set[str] = set()
    body = mapping["repos"].get(repo)
    if not body:
        return keep
    for entry in body["files"]:
        tgt = entry["target"]
        src = entry["source_path"]
        src_repo = entry["source_repo"]
        if tgt is not None:
            keep.add(tgt)
        elif src_repo == repo:
            # target=null: source preserved in place (e.g. Llama QLoRA).
            keep.add(src)
    return keep


def is_always_kept(path: str) -> bool:
    base = path.rsplit("/", 1)[-1]
    return base in ALWAYS_KEEP_BASENAMES


def compute_orphans(api: HfApi, repo: str, mapping: dict) -> list[str]:
    files = sorted(api.list_repo_files(f"{ORG}/{repo}", repo_type="model"))
    keep = keep_set_for(repo, mapping)
    orphans: list[str] = []
    for f in files:
        if f in keep or is_always_kept(f):
            continue
        # Only `config.json` files are considered stale by this cleanup.
        # Other unreferenced files (e.g. unannounced *.pte variants,
        # tokenizer_config.json, viterbi_calibration.json) are intentional
        # repo content and stay.
        if f.rsplit("/", 1)[-1] != "config.json":
            continue
        orphans.append(f)
    return orphans


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mapping", type=pathlib.Path, default=HERE / "mapping.yaml")
    parser.add_argument("--draft", action="store_true", help="Use mapping.draft.yaml")
    parser.add_argument("--repo", type=str, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.draft:
        args.mapping = HERE / "mapping.draft.yaml"
    if not args.mapping.exists():
        print(f"mapping missing: {args.mapping}", file=sys.stderr)
        return 2

    mapping = load_mapping(args.mapping)
    target_repos = list(mapping["repos"].keys())
    if args.repo:
        if args.repo not in target_repos:
            print(f"unknown target repo: {args.repo}", file=sys.stderr)
            return 2
        target_repos = [args.repo]

    api = HfApi()
    total = 0
    for repo in sorted(target_repos):
        orphans = compute_orphans(api, repo, mapping)
        if not orphans:
            print(f"  {repo}: clean")
            continue
        total += len(orphans)
        print(f"\n=== {repo} ({len(orphans)} orphans) ===")
        for o in orphans:
            print(f"  Delete: {o}")
        if args.dry_run:
            continue
        operations = [CommitOperationDelete(path_in_repo=o) for o in orphans]
        commit = api.create_commit(
            repo_id=f"{ORG}/{repo}",
            operations=operations,
            commit_message="Remove old-layout metadata orphaned by MODEL_SPEC.md restructure",
            repo_type="model",
        )
        print(f"  → {commit.commit_url}")
    print(f"\ntotal orphans across {len(target_repos)} repos: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
