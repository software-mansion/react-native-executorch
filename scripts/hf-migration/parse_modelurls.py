#!/usr/bin/env python3
"""Parse modelUrls.ts and emit a flat list of every HF URL the library references.

Resolves tag-variable substitution through versions.ts, so renames like
`VERSION_TAG` → `PREVIOUS_VERSION_TAG` (PR #1139) do not affect downstream
tooling: every reference resolves to a concrete `resolve/vX.Y.Z` tag.

Writes scripts/hf-migration/refs.json:

```json
{
  "tag_resolution": { "VERSION_TAG": "resolve/v0.8.0", ... },
  "refs": [
    { "repo": "react-native-executorch-llama-3.2",
      "tag": "resolve/v0.8.0",
      "path": "llama-3.2-3B/original/llama3_2_3B_bf16.pte" },
    ...
  ]
}
```
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
VERSIONS_TS = ROOT / "packages/react-native-executorch/src/constants/versions.ts"
MODELURLS_TS = ROOT / "packages/react-native-executorch/src/constants/modelUrls.ts"
OUT = pathlib.Path(__file__).parent / "refs.json"

# All variable names that historically held a `resolve/v...` tag in
# versions.ts. Matching by name keeps the parser stable under renames.
TAG_VARS = ("VERSION_TAG", "PREVIOUS_VERSION_TAG", "NEXT_VERSION_TAG")

# `export const VERSION_TAG = 'resolve/v0.8.0';`
# `export const VERSION_TAG = ` + a template literal.
TAG_CONST = re.compile(
    r"export\s+const\s+(\w+)\s*=\s*"
    r"(?:`([^`]+)`|'([^']+)'|\"([^\"]+)\")\s*;"
)


def load_tag_resolution() -> dict[str, str]:
    """Read versions.ts and return {VAR_NAME: resolved_tag_string}.

    Resolves nested references like `resolve/v${LIB_VERSION}` by substituting
    sibling constants from the same file.
    """
    src = VERSIONS_TS.read_text()
    raw: dict[str, str] = {}
    for m in TAG_CONST.finditer(src):
        name = m.group(1)
        value = m.group(2) or m.group(3) or m.group(4)
        raw[name] = value

    def resolve(s: str, seen: tuple[str, ...] = ()) -> str:
        def sub(m: re.Match[str]) -> str:
            inner = m.group(1)
            if inner in seen:
                raise ValueError(f"variable cycle: {seen + (inner,)}")
            if inner not in raw:
                raise ValueError(f"undefined variable ${{{inner}}} in versions.ts")
            return resolve(raw[inner], seen + (inner,))

        return re.sub(r"\$\{(\w+)\}", sub, s)

    return {name: resolve(value) for name, value in raw.items() if name in TAG_VARS}


def extract_refs(tag_resolution: dict[str, str]) -> list[dict[str, str]]:
    """Find every `${URL_PREFIX}-<repo>/${<TAG>}/<path>` reference in modelUrls.ts."""
    src = MODELURLS_TS.read_text()
    tag_alternation = "|".join(re.escape(v) for v in TAG_VARS)
    # Non-greedy on every segment so we never cross a `\`` boundary.
    pattern = re.compile(
        r"`\$\{URL_PREFIX\}-([^/`]+?)/\$\{(" + tag_alternation + r")\}/([^`]+?)`"
    )
    seen: set[tuple[str, str, str]] = set()
    refs: list[dict[str, str]] = []
    for m in pattern.finditer(src):
        repo_suffix, tag_var, path = m.group(1), m.group(2), m.group(3)
        if tag_var not in tag_resolution:
            print(
                f"warning: ${tag_var} referenced in modelUrls.ts but not "
                f"defined as a tag in versions.ts",
                file=sys.stderr,
            )
            continue
        tag = tag_resolution[tag_var]
        key = (repo_suffix, tag, path)
        if key in seen:
            continue
        seen.add(key)
        refs.append(
            {
                "repo": f"react-native-executorch-{repo_suffix}",
                "tag": tag,
                "path": path,
            }
        )
    return refs


def main() -> int:
    tag_resolution = load_tag_resolution()
    refs = extract_refs(tag_resolution)
    refs.sort(key=lambda r: (r["repo"], r["tag"], r["path"]))

    out = {"tag_resolution": tag_resolution, "refs": refs}
    OUT.write_text(json.dumps(out, indent=2) + "\n")

    print(f"tag resolution: {tag_resolution}", file=sys.stderr)
    print(f"extracted {len(refs)} unique URL references", file=sys.stderr)
    by_repo: dict[str, int] = {}
    for r in refs:
        by_repo[r["repo"]] = by_repo.get(r["repo"], 0) + 1
    print(f"across {len(by_repo)} repos:", file=sys.stderr)
    for repo, count in sorted(by_repo.items()):
        print(f"  {repo}: {count}", file=sys.stderr)
    print(f"wrote {OUT}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
