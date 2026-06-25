#!/usr/bin/env bash
#
# Pre-commit guard: fail the commit when staged C/C++ sources in the core package
# produce compiler warnings under the project's clangd warning set — i.e. the
# include flags in compile_flags.txt plus the -W flags in .clangd. This mirrors
# what clangd shows in the editor, so a commit can't introduce a warning that the
# editor would have flagged.
#
# It skips gracefully (without blocking the commit) when a C++ compiler or the
# provisioned ExecuTorch/JSI headers are not available, so contributors who don't
# build the native code are never blocked. Bypass explicitly with `git commit
# --no-verify`. Override the compiler with CXX=/path/to/clang++.
#
# Usage: check-cpp-warnings.sh <staged file> [<staged file> ...]
set -uo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PKG_PREFIX="packages/react-native-executorch/"

# Keep only staged files inside this package's cpp/ tree, relative to PKG_DIR.
rel_files=()
for f in "$@"; do
  case "$f" in
    "${PKG_PREFIX}"cpp/*) rel_files+=("${f#"$PKG_PREFIX"}") ;;
    cpp/*)                rel_files+=("$f") ;;
  esac
done
[ "${#rel_files[@]}" -eq 0 ] && exit 0

CXX="${CXX:-clang++}"
if ! command -v "$CXX" >/dev/null 2>&1; then
  echo "ℹ C++ warning check skipped: no compiler ('$CXX') on PATH (set CXX to override)."
  exit 0
fi

cd "$PKG_DIR"

if [ ! -d third-party/include/executorch ] ||
   [ ! -f ../../node_modules/react-native/ReactCommon/jsi/jsi/jsi.h ]; then
  echo "ℹ C++ warning check skipped: provision third-party/include and run 'yarn install' to enable it."
  exit 0
fi

# Compilation database (includes / std / defines) + the .clangd warning set.
db_flags=()
while IFS= read -r line; do
  [ -n "$line" ] && db_flags+=("$line")
done < compile_flags.txt
warn_flags=()
while IFS= read -r w; do warn_flags+=("$w"); done < <(grep -oE '\-W[A-Za-z0-9=-]+' .clangd)

status=0
for f in "${rel_files[@]}"; do
  [ -f "$f" ] || continue  # skip deleted/renamed entries
  if out="$("$CXX" -fsyntax-only "${db_flags[@]}" "${warn_flags[@]}" "$f" 2>&1)" && [ -z "$out" ]; then
    continue
  fi
  if printf '%s\n' "$out" | grep -qE '(warning|error):'; then
    printf '%s\n' "$out" >&2
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  echo >&2
  echo "✖ C++ warnings in staged sources (above). Fix them, or bypass with 'git commit --no-verify'." >&2
fi
exit "$status"
