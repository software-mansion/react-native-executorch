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
CONSTANTS_DIR = ROOT / "packages/react-native-executorch/src/constants"
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


def find_constants_files() -> list[pathlib.Path]:
    """Every .ts file under constants/ that references URL_PREFIX."""
    files = []
    for ts in sorted(CONSTANTS_DIR.rglob("*.ts")):
        if ts == VERSIONS_TS:
            continue
        text = ts.read_text()
        if "URL_PREFIX" in text and "${URL_PREFIX}" in text:
            files.append(ts)
    return files


def resolve_indirections(src: str, tag_resolution: dict[str, str]) -> dict[str, str]:
    """Build a name→concrete-url-fragment map for every `const X = `<template>` `
    that ultimately resolves to a URL_PREFIX-rooted path.

    Iterative substitution: a const can reference another const, so we run
    until the map stabilises. Each value, after resolution, looks like
    `<repo>/<tag>/<path-prefix>` (no `${}` left).
    """
    tag_alternation = "|".join(re.escape(v) for v in TAG_VARS)
    const_template = re.compile(
        r"const\s+(\w+)\s*=\s*`([^`]+)`",
        re.DOTALL,
    )
    raw: dict[str, str] = {}
    for m in const_template.finditer(src):
        raw[m.group(1)] = m.group(2)

    def expand(s: str, seen: tuple[str, ...] = ()) -> str | None:
        # Replace ${VAR} with raw[VAR] (recursing) or with a tag value, or fail.
        out_parts: list[str] = []
        i = 0
        while i < len(s):
            if s.startswith("${", i):
                end = s.find("}", i)
                if end < 0:
                    return None
                var = s[i + 2 : end]
                if var in tag_resolution:
                    out_parts.append(tag_resolution[var])
                elif var == "URL_PREFIX":
                    out_parts.append("URL_PREFIX")  # sentinel; checked below
                elif var in raw and var not in seen:
                    inner = expand(raw[var], seen + (var,))
                    if inner is None:
                        return None
                    out_parts.append(inner)
                else:
                    return None
                i = end + 1
            else:
                out_parts.append(s[i])
                i += 1
        return "".join(out_parts)

    resolved: dict[str, str] = {}
    for name, tpl in raw.items():
        v = expand(tpl)
        if v and v.startswith("URL_PREFIX-"):
            resolved[name] = v
    return resolved


def extract_refs(tag_resolution: dict[str, str]) -> list[dict[str, str]]:
    """Find every URL_PREFIX-rooted reference across every constants file.

    Handles two forms:
    1. Direct template literal: `` `${URL_PREFIX}-foo/${TAG}/path.pte` ``.
    2. Indirect via const chains, e.g.
       ``const ROOT = `${URL_PREFIX}-kokoro/${TAG}/xnnpack`;``
       ``const SMALL = `${ROOT}/small`;``
       ``synthesizerSource: `${SMALL}/synthesizer.pte`;``
    """
    seen: set[tuple[str, str, str]] = set()
    refs: list[dict[str, str]] = []

    def add(repo_suffix: str, tag: str, path: str) -> None:
        # Skip wildcards like ${alphabet} that depend on runtime values.
        if "${" in path or "${" in repo_suffix:
            return
        # Skip path fragments that are intermediate const expansions, not real
        # files (e.g. `xnnpack`, `voices`). Real files end in a recognised
        # extension.
        if not any(path.endswith(ext) for ext in (".pte", ".json", ".bin", ".txt", ".vocab")):
            return
        key = (repo_suffix, tag, path)
        if key in seen:
            return
        seen.add(key)
        refs.append(
            {
                "repo": f"react-native-executorch-{repo_suffix}",
                "tag": tag,
                "path": path,
            }
        )

    template_lit = re.compile(r"`([^`]+)`")

    for ts in find_constants_files():
        src = ts.read_text()
        resolved = resolve_indirections(src, tag_resolution)

        for m in template_lit.finditer(src):
            literal = m.group(1)
            # Expand ${X} for every X in resolved or tag_resolution.
            expanded = literal
            substitutions = {
                "URL_PREFIX": "URL_PREFIX",
                **tag_resolution,
                **resolved,
            }
            for _ in range(8):  # bounded loop in case of weird cycles
                if "${" not in expanded:
                    break
                progressed = False
                for name, value in substitutions.items():
                    needle = "${" + name + "}"
                    if needle in expanded:
                        expanded = expanded.replace(needle, value)
                        progressed = True
                if not progressed:
                    break

            if not expanded.startswith("URL_PREFIX-"):
                continue
            # Form: URL_PREFIX-<repo>/<tag>/<path>
            rest = expanded[len("URL_PREFIX-") :]
            # tag is the second `/`-separated component.
            parts = rest.split("/", 2)
            if len(parts) < 3:
                continue
            repo_suffix, tag, path = parts[0], parts[1], parts[2]
            # tag must look like `resolve/vX.Y.Z` after resolution; the tag
            # values in tag_resolution are e.g. `resolve/v0.8.0`, so the
            # split eats only one of the two segments. Stitch back.
            if not tag.startswith("resolve"):
                continue
            # `tag` so far is `resolve`; the version sits at the start of `path`.
            version_and_rest = path.split("/", 1)
            if len(version_and_rest) < 2:
                continue
            full_tag = f"{tag}/{version_and_rest[0]}"
            path = version_and_rest[1]
            add(repo_suffix, full_tag, path)

    return refs


# Repos whose URLs are built via runtime function parameters (e.g.
# `createHFRecognizerDownloadUrl(alphabet)` in ocr/models.ts iterates over the
# `alphabets` enum). The parser can't expand those without evaluating the TS,
# so the file list is enumerated here. Each tuple is (repo_suffix, tag_var,
# path-with-{token}, token-values).
RUNTIME_EXPANSIONS: list[tuple[str, str, str, list[str]]] = [
    (
        "recognizer-crnn.en",
        "VERSION_TAG",
        "xnnpack/{alphabet}/xnnpack_crnn_{alphabet}.pte",
        ["cyrillic", "english", "japanese", "kannada", "korean", "latin", "telugu", "zh_sim"],
    ),
]


def expand_runtime(tag_resolution: dict[str, str], refs: list[dict[str, str]]) -> None:
    """Append refs that the parser can't derive from static analysis."""
    seen = {(r["repo"], r["tag"], r["path"]) for r in refs}
    for repo_suffix, tag_var, pattern, values in RUNTIME_EXPANSIONS:
        if tag_var not in tag_resolution:
            continue
        tag = tag_resolution[tag_var]
        for v in values:
            path = pattern.format(alphabet=v)
            key = (f"react-native-executorch-{repo_suffix}", tag, path)
            if key not in seen:
                seen.add(key)
                refs.append({"repo": key[0], "tag": tag, "path": path})


def main() -> int:
    tag_resolution = load_tag_resolution()
    refs = extract_refs(tag_resolution)
    expand_runtime(tag_resolution, refs)
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
