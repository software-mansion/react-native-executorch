#!/usr/bin/env python3
"""Snapshot every `software-mansion/react-native-executorch-*` HF repo.

Writes scripts/hf-migration/inventory.json with each repo's `main` file list
and its git tags. The snapshot is checked in so mapping generation is
deterministic against a known state.

Requires huggingface_hub and an HF token with read access to the
software-mansion org.
"""

from __future__ import annotations

import json
import pathlib
import sys

from huggingface_hub import HfApi

ORG = "software-mansion"
PREFIX = "react-native-executorch-"
OUT = pathlib.Path(__file__).parent / "inventory.json"


def main() -> int:
    api = HfApi()
    repos = sorted(
        m.modelId
        for m in api.list_models(author=ORG, limit=500)
        if m.modelId.startswith(f"{ORG}/{PREFIX}")
    )
    print(f"found {len(repos)} {PREFIX}* repos under {ORG}", file=sys.stderr)

    inventory: dict[str, dict[str, list[str]]] = {}
    for repo_id in repos:
        short = repo_id.split("/", 1)[1]
        files = sorted(api.list_repo_files(repo_id, repo_type="model"))
        refs = api.list_repo_refs(repo_id, repo_type="model")
        tags = sorted(t.name for t in refs.tags)
        inventory[short] = {"tags": tags, "files_main": files}
        print(f"  {short}: {len(files)} files, tags={tags}", file=sys.stderr)

    OUT.write_text(json.dumps(inventory, indent=2, sort_keys=True) + "\n")
    print(f"wrote {OUT}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
