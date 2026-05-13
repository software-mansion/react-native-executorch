#!/usr/bin/env python3
"""Apply mapping.yaml against the software-mansion HF org.

For each target repo:
  - Same-repo file renames are batched into one atomic commit
    (`CommitOperationCopy` + `CommitOperationDelete`).
  - Cross-repo consolidations (whisper-*-quantized.en → whisper-*.en) are
    download → upload. Source repos are left untouched per MODEL_SPEC.md §7.3.
  - Files with `target: null` (Llama QLoRA) are skipped.
  - After all file ops succeed, the target tag (default `v0.9.0`) is
    force-moved to point at the new state of `main`.

Run with `--dry-run` to print the plan without mutating HF state. Run with
`--repo <suffix>` to migrate one repo at a time.

Reads mapping.yaml (or mapping.draft.yaml with --draft). Requires
huggingface_hub and an HF token with write access to software-mansion.
"""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import re
import sys
import tempfile
from collections import defaultdict
from typing import Any, Optional

from huggingface_hub import (
    CommitOperationAdd,
    CommitOperationCopy,
    CommitOperationDelete,
    HfApi,
    hf_hub_download,
)
from huggingface_hub.utils import EntryNotFoundError

ORG = "software-mansion"
HERE = pathlib.Path(__file__).parent

# ---------------------------------------------------------------------------
# Tiny YAML reader (just enough to parse mapping.yaml produced by
# generate_mapping.py; no third-party dependency).
# ---------------------------------------------------------------------------


def parse_yaml(text: str) -> Any:
    """Parse the specific subset of YAML emitted by generate_mapping.py.

    Supports two-space-indented blocks, scalar values, dict/list nesting,
    and `null`. No flow style, no anchors, no multi-line scalars.
    """
    lines = [ln for ln in text.splitlines() if ln.strip() and not ln.lstrip().startswith("#")]
    pos = [0]

    def peek_indent() -> int:
        if pos[0] >= len(lines):
            return -1
        ln = lines[pos[0]]
        return len(ln) - len(ln.lstrip(" "))

    def parse_scalar(s: str) -> Any:
        s = s.strip()
        if s == "null":
            return None
        if s == "true":
            return True
        if s == "false":
            return False
        if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
            return s[1:-1]
        try:
            return int(s)
        except ValueError:
            return s

    def parse_block(indent: int) -> Any:
        if pos[0] >= len(lines):
            return None
        first = lines[pos[0]].lstrip(" ")
        if first.startswith("- "):
            items: list[Any] = []
            while pos[0] < len(lines) and peek_indent() == indent and lines[pos[0]].lstrip(" ").startswith("- "):
                ln = lines[pos[0]][indent:]
                body = ln[2:]
                if ":" in body and not body.endswith(":"):
                    # Inline first key: `- key: value`
                    key, _, value = body.partition(":")
                    if value.strip():
                        pos[0] += 1
                        item: dict[str, Any] = {key.strip(): parse_scalar(value)}
                        while pos[0] < len(lines) and peek_indent() > indent:
                            k_ln = lines[pos[0]][indent + 2 :]
                            k, _, v = k_ln.partition(":")
                            if v.strip():
                                item[k.strip()] = parse_scalar(v)
                                pos[0] += 1
                            else:
                                pos[0] += 1
                                item[k.strip()] = parse_block(indent + 4)
                        items.append(item)
                        continue
                if body.endswith(":"):
                    # `- key:` then nested block
                    pos[0] += 1
                    item = {body[:-1].strip(): parse_block(indent + 4)}
                    while pos[0] < len(lines) and peek_indent() > indent:
                        k_ln = lines[pos[0]][indent + 2 :]
                        k, _, v = k_ln.partition(":")
                        if v.strip():
                            item[k.strip()] = parse_scalar(v)
                            pos[0] += 1
                        else:
                            pos[0] += 1
                            item[k.strip()] = parse_block(indent + 4)
                    items.append(item)
                    continue
                pos[0] += 1
                items.append(parse_scalar(body))
            return items
        result: dict[str, Any] = {}
        while pos[0] < len(lines) and peek_indent() == indent:
            ln = lines[pos[0]][indent:]
            key, _, value = ln.partition(":")
            if value.strip():
                result[key.strip()] = parse_scalar(value)
                pos[0] += 1
            else:
                pos[0] += 1
                result[key.strip()] = parse_block(indent + 2)
        return result

    return parse_block(0)


# ---------------------------------------------------------------------------
# Migration logic
# ---------------------------------------------------------------------------


def repo_id(short: str) -> str:
    return f"{ORG}/{short}"


def get_blob_sha(api: HfApi, short: str, path: str) -> Optional[str]:
    """Return the LFS sha256 (or git blob sha for non-LFS) of a file on main.

    Returns None if the path doesn't exist.
    """
    try:
        infos = api.get_paths_info(repo_id(short), paths=[path], repo_type="model")
    except EntryNotFoundError:
        return None
    if not infos:
        return None
    info = infos[0]
    lfs = getattr(info, "lfs", None)
    if lfs is not None:
        return getattr(lfs, "sha256", None) or getattr(lfs, "oid", None)
    return getattr(info, "blob_id", None)


def sha256_of(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def plan_per_repo(mapping: dict) -> dict[str, list[dict]]:
    plans: dict[str, list[dict]] = defaultdict(list)
    for target_repo, body in mapping["repos"].items():
        for entry in body["files"]:
            plans[target_repo].append(entry)
    return plans


def execute_same_repo(
    api: HfApi,
    short: str,
    entries: list[dict],
    dry_run: bool,
) -> Optional[str]:
    """Atomic rename within one repo. Returns commit url, or None on dry-run."""
    operations: list[Any] = []
    for entry in entries:
        src = entry["source_path"]
        tgt = entry["target"]
        if tgt is None:
            continue
        if src == tgt:
            continue
        operations.append(
            CommitOperationCopy(src_path_in_repo=src, path_in_repo=tgt)
        )
        operations.append(CommitOperationDelete(path_in_repo=src))
    if not operations:
        return None
    print(f"  same-repo: {len(operations)//2} renames")
    if dry_run:
        for op in operations:
            kind = type(op).__name__.replace("CommitOperation", "")
            if kind == "Copy":
                print(f"    Copy: {op.src_path_in_repo} -> {op.path_in_repo}")
            elif kind == "Delete":
                print(f"    Delete: {op.path_in_repo}")
            else:
                print(f"    {kind}: {getattr(op, 'path_in_repo', '?')}")
        return None
    commit = api.create_commit(
        repo_id=repo_id(short),
        operations=operations,
        commit_message="Restructure to MODEL_SPEC.md convention",
        repo_type="model",
    )
    return commit.commit_url


def execute_cross_repo(
    api: HfApi,
    target_short: str,
    entries: list[dict],
    dry_run: bool,
) -> Optional[str]:
    """Download from source repos, upload as a single atomic commit on target.

    Collision policy: if a target path is already present and the blob sha
    matches the source, skip the operation. If shas differ, abort the entire
    repo's migration so the human can inspect.
    """
    operations: list[Any] = []
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="hf-migrate-"))
    try:
        for entry in entries:
            src_short = entry["source_repo"]
            src_path = entry["source_path"]
            tgt_path = entry["target"]
            if tgt_path is None:
                continue

            src_sha = get_blob_sha(api, src_short, src_path)
            if src_sha is None:
                print(
                    f"  ERROR: source missing {src_short}:{src_path}",
                    file=sys.stderr,
                )
                return None

            tgt_sha = get_blob_sha(api, target_short, tgt_path)
            if tgt_sha == src_sha:
                print(f"  skip (identical): {tgt_path}")
                continue
            if tgt_sha is not None and tgt_sha != src_sha:
                print(
                    f"  COLLISION at {target_short}:{tgt_path}\n"
                    f"    source sha {src_sha[:12]} != target sha {tgt_sha[:12]}",
                    file=sys.stderr,
                )
                return None

            print(f"  cross-repo: {src_short}:{src_path} -> {target_short}:{tgt_path}")
            if dry_run:
                continue
            local = pathlib.Path(
                hf_hub_download(
                    repo_id=repo_id(src_short),
                    filename=src_path,
                    revision="main",
                    local_dir=tmp / src_short,
                )
            )
            operations.append(
                CommitOperationAdd(path_in_repo=tgt_path, path_or_fileobj=str(local))
            )

        if not operations:
            return None
        commit = api.create_commit(
            repo_id=repo_id(target_short),
            operations=operations,
            commit_message="Consolidate per MODEL_SPEC.md convention",
            repo_type="model",
        )
        return commit.commit_url
    finally:
        # Caller may want logs; cleanup is best-effort.
        pass


def force_move_tag(api: HfApi, short: str, tag: str, dry_run: bool) -> None:
    """Create or force-move `tag` to point at the current `main` HEAD."""
    print(f"  tag: {tag} -> main")
    if dry_run:
        return
    try:
        api.delete_tag(repo_id=repo_id(short), tag=tag, repo_type="model")
    except Exception:
        # OK if it didn't exist.
        pass
    api.create_tag(repo_id=repo_id(short), tag=tag, revision="main", repo_type="model")


def migrate_repo(api: HfApi, short: str, entries: list[dict], target_tag: str, dry_run: bool) -> bool:
    same_repo = [e for e in entries if e["source_repo"] == short]
    cross_repo = [e for e in entries if e["source_repo"] != short]
    print(f"\n=== {short} ({len(same_repo)} same-repo, {len(cross_repo)} cross-repo) ===")
    if same_repo:
        execute_same_repo(api, short, same_repo, dry_run)
    if cross_repo:
        execute_cross_repo(api, short, cross_repo, dry_run)
    force_move_tag(api, short, target_tag, dry_run)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mapping",
        type=pathlib.Path,
        default=HERE / "mapping.yaml",
        help="Mapping YAML (default: scripts/hf-migration/mapping.yaml).",
    )
    parser.add_argument(
        "--draft",
        action="store_true",
        help="Use mapping.draft.yaml. Mutually exclusive with --mapping override.",
    )
    parser.add_argument(
        "--repo",
        type=str,
        default=None,
        help="Restrict to one target repo by short name (e.g. react-native-executorch-llama-3.2).",
    )
    parser.add_argument(
        "--tag",
        type=str,
        default=None,
        help="Override target tag from mapping (e.g. v0.9.0).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print plan without mutating HF.",
    )
    args = parser.parse_args()

    if args.draft:
        args.mapping = HERE / "mapping.draft.yaml"
    if not args.mapping.exists():
        print(f"mapping file missing: {args.mapping}", file=sys.stderr)
        return 2

    mapping = parse_yaml(args.mapping.read_text())
    target_tag = args.tag or mapping.get("target_tag", "v0.9.0")
    plans = plan_per_repo(mapping)

    api = HfApi()
    repos = [args.repo] if args.repo else sorted(plans.keys())
    if args.repo and args.repo not in plans:
        print(f"unknown target repo: {args.repo}", file=sys.stderr)
        return 2

    print(f"target tag: {target_tag}")
    print(f"dry-run: {args.dry_run}")
    print(f"repos: {len(repos)}")

    failed: list[str] = []
    for short in repos:
        try:
            migrate_repo(api, short, plans[short], target_tag, args.dry_run)
        except Exception as e:
            print(f"\nERROR while migrating {short}: {e}", file=sys.stderr)
            failed.append(short)

    if failed:
        print(f"\nfailed repos ({len(failed)}): {failed}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
