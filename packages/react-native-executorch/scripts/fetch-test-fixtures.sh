#!/usr/bin/env bash
#
# Downloads the fixtures the C++ model, schema and tokenizer tests load.
#
#   * A .pte program. Anything that reads ExecuTorch MethodMeta
#     (schema::methodSpecFromMetadata, validateSpec, getUsedBackends, and
#     ModelHostObject's whole load path) needs a real program to read it from.
#     This fetches the smallest one the org publishes: selfie-segmentation,
#     ~486 KB. Note this only covers *loading*. Executing the model additionally
#     needs an XNNPACK host build, which these tests deliberately do not require
#     — see cpp/tests/README.md.
#   * A HuggingFace tokenizer.json, which the nlp extension loads through
#     ExecuTorch's HFTokenizer. Whisper tiny.en's is a plain BPE vocabulary,
#     ~2.4 MB.
#
# Both are pinned to an exact Hugging Face revision and verified against a
# recorded sha256, so a re-tag upstream cannot silently change what the tests
# assert. Idempotent: a no-op when a fixture is already present and matches.
#
# Usage:
#   scripts/fetch-test-fixtures.sh
set -euo pipefail

cd "$(dirname "$0")/.."

FIXTURE_DIR="cpp/tests/fixtures"

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

# fetch_fixture <local-name> <hf-repo> <hf-revision> <path-in-repo> <sha256>
fetch_fixture() {
  local name="$1" repo="$2" revision="$3" path="$4" expected="$5"
  local target="${FIXTURE_DIR}/${name}"

  if [ -f "$target" ] && [ "$(sha256_of "$target")" = "$expected" ]; then
    echo "✓ ${name} already present"
    return
  fi

  mkdir -p "$FIXTURE_DIR"
  local url="https://huggingface.co/${repo}/resolve/${revision}/${path}"
  echo "↓ ${url}"
  curl -fsSL -o "${target}.tmp" "$url"

  local actual
  actual="$(sha256_of "${target}.tmp")"
  if [ "$actual" != "$expected" ]; then
    rm -f "${target}.tmp"
    echo "error: checksum mismatch for ${name}" >&2
    echo "  expected ${expected}" >&2
    echo "  actual   ${actual}" >&2
    exit 1
  fi

  mv "${target}.tmp" "$target"
  echo "✓ ${name} ready"
}

fetch_fixture \
  "selfie_segmentation_xnnpack_fp32.pte" \
  "software-mansion/react-native-executorch-selfie-segmentation" \
  "13a9494d8230279b47973b91c94b1aa902d307a6" \
  "xnnpack/selfie_segmentation_xnnpack_fp32.pte" \
  "176aba6a0719b56391586a3d19396315305c7adb5c16aafda350fecc596cebf9"

fetch_fixture \
  "tokenizer.json" \
  "software-mansion/react-native-executorch-whisper-tiny.en" \
  "c99612ff807ef223f6316f33a4be7c587835a5ce" \
  "tokenizer.json" \
  "5eb60cec1e77aeeb6869a2bb5a8e01a84c3fe5d072d75369343021fe6f5310d0"
