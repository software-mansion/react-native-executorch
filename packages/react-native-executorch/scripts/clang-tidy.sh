#!/usr/bin/env bash
#
# Runs clang-tidy over the package's own C/C++ sources, using the checks in
# .clang-tidy and the include flags from compile_flags.txt (the same database
# clangd uses). Any finding fails the run (--warnings-as-errors).
#
# Usage:
#   scripts/clang-tidy.sh [file ...]   # defaults to every *.cpp under cpp/
#
# Prerequisites (same as a native build): a provisioned third-party/include and
# `yarn install` at the repo root, so the third-party / JSI includes resolve.
# Override the binary with CLANG_TIDY=/path/to/clang-tidy (e.g. Homebrew LLVM).
set -euo pipefail

cd "$(dirname "$0")/.."

CLANG_TIDY="${CLANG_TIDY:-clang-tidy}"

if ! command -v "$CLANG_TIDY" >/dev/null 2>&1; then
  echo "error: '$CLANG_TIDY' not found. Install LLVM (e.g. 'brew install llvm' or" \
       "'apt-get install clang-tidy') or set CLANG_TIDY to its path." >&2
  exit 127
fi

if [ "$#" -gt 0 ]; then
  files=("$@")
else
  files=()
  while IFS= read -r f; do files+=("$f"); done < <(find cpp -name '*.cpp' | sort)
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "No C++ sources to check."
  exit 0
fi

echo "Running clang-tidy on ${#files[@]} file(s)…"
exec "$CLANG_TIDY" --warnings-as-errors='*' "${files[@]}"
