#!/usr/bin/env python3
"""Upload locally-generated config.json files to their target HF repos.

Reads `scripts/hf-migration/configs/<repo>/<rest>/config.json` and uploads
each to the matching path on its repo's `main`. Per-repo files are batched
into one atomic commit. After all uploads succeed, the target tag (default
`v0.9.0`) is force-moved to point at the new `main`.

Run with `--dry-run` to inspect the plan. `--repo <short>` restricts to
one repo. `--tag <name>` overrides the target tag.
"""

from __future__ import annotations

import argparse
import pathlib
import sys
from collections import defaultdict

from huggingface_hub import CommitOperationAdd, HfApi

ORG = "software-mansion"
HERE = pathlib.Path(__file__).parent
CONFIGS_DIR = HERE / "configs"
DEFAULT_TAG = "v0.9.0"


def collect_uploads() -> dict[str, list[tuple[str, pathlib.Path]]]:
    """Returns {repo_short: [(path_in_repo, local_path), ...]}."""
    uploads: dict[str, list[tuple[str, pathlib.Path]]] = defaultdict(list)
    for config_path in sorted(CONFIGS_DIR.rglob("config.json")):
        rel = config_path.relative_to(CONFIGS_DIR)
        parts = rel.parts
        if len(parts) < 2:
            continue
        repo_short = parts[0]
        path_in_repo = "/".join(parts[1:])
        uploads[repo_short].append((path_in_repo, config_path))
    return uploads


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=str, default=None)
    parser.add_argument("--tag", type=str, default=DEFAULT_TAG)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not CONFIGS_DIR.exists():
        print(f"missing {CONFIGS_DIR}; run gen_config.py first", file=sys.stderr)
        return 2

    uploads = collect_uploads()
    if args.repo:
        if args.repo not in uploads:
            print(f"unknown repo: {args.repo}", file=sys.stderr)
            return 2
        uploads = {args.repo: uploads[args.repo]}

    print(f"target tag: {args.tag}")
    print(f"dry-run: {args.dry_run}")
    print(f"repos: {len(uploads)}")

    api = HfApi()
    failed: list[str] = []
    for short in sorted(uploads):
        entries = uploads[short]
        print(f"\n=== {short} ({len(entries)} config.json files) ===")
        for path_in_repo, local in entries:
            print(f"  upload: {path_in_repo}")
        if args.dry_run:
            continue
        try:
            operations = [
                CommitOperationAdd(path_in_repo=p, path_or_fileobj=str(l))
                for p, l in entries
            ]
            commit = api.create_commit(
                repo_id=f"{ORG}/{short}",
                operations=operations,
                commit_message="Add spec-compliant config.json files",
                repo_type="model",
            )
            print(f"  → {commit.commit_url}")
            # Force-move tag to new main.
            try:
                api.delete_tag(repo_id=f"{ORG}/{short}", tag=args.tag, repo_type="model")
            except Exception:
                pass
            api.create_tag(
                repo_id=f"{ORG}/{short}",
                tag=args.tag,
                revision="main",
                repo_type="model",
            )
            print(f"  tag: {args.tag} -> main")
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            failed.append(short)

    if failed:
        print(f"\nfailed: {failed}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
