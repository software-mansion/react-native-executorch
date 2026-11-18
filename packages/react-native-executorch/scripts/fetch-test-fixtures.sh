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
#   * Kokoro's phonemizer data for the languages it phonemizes without a
#     neural model: the en-us tagger (en-gb's is the same file), the en-us and
#     en-gb lexicons, and the zh segmenter and lexicon (~26 MB together). With
#     them phonemis produces real phonemes, so the phonemizer's text
#     normalization and word locating are pinned end to end.
#
# All are pinned to an exact Hugging Face revision and verified against a
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

  mkdir -p "$(dirname "$target")"
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
  "software-mansion/MediaPipe-Selfie-Segmentation-ExecuTorch" \
  "13a9494d8230279b47973b91c94b1aa902d307a6" \
  "xnnpack/selfie_segmentation_xnnpack_fp32.pte" \
  "176aba6a0719b56391586a3d19396315305c7adb5c16aafda350fecc596cebf9"

fetch_fixture \
  "tokenizer.json" \
  "software-mansion/whisper-tiny.en-ExecuTorch" \
  "c99612ff807ef223f6316f33a4be7c587835a5ce" \
  "tokenizer.json" \
  "5eb60cec1e77aeeb6869a2bb5a8e01a84c3fe5d072d75369343021fe6f5310d0"

fetch_fixture \
  "phonemizer/en-us/tags.json" \
  "software-mansion/Kokoro-82M-ExecuTorch" \
  "4836d50e0fa48d7cdd415210f6c2c0e1acba5acb" \
  "phonemizer/en-us/tags.json" \
  "028f7d6a0ee7638d91fab27ef8809c0b36de312e6409b6b8e844bffd0871e3e7"

fetch_fixture \
  "phonemizer/en-us/lexicon.json" \
  "software-mansion/Kokoro-82M-ExecuTorch" \
  "4836d50e0fa48d7cdd415210f6c2c0e1acba5acb" \
  "phonemizer/en-us/lexicon.json" \
  "b29e9c13190cf211979e8d9c38258cc1cb8e701e5ca1102a0c1f00acd4f55f8e"

fetch_fixture \
  "phonemizer/en-gb/lexicon.json" \
  "software-mansion/Kokoro-82M-ExecuTorch" \
  "4836d50e0fa48d7cdd415210f6c2c0e1acba5acb" \
  "phonemizer/en-gb/lexicon.json" \
  "f4ad98b7725c681be79df533288e20df71db40a89d0cfdead2192f0d61449399"

fetch_fixture \
  "phonemizer/zh/segmenter.json" \
  "software-mansion/Kokoro-82M-ExecuTorch" \
  "4836d50e0fa48d7cdd415210f6c2c0e1acba5acb" \
  "phonemizer/zh/segmenter.json" \
  "4079bc04a9028e7fb0e7b015a327b5c65301feb3069d4ba391ff823fa357c200"

fetch_fixture \
  "phonemizer/zh/lexicon.json" \
  "software-mansion/Kokoro-82M-ExecuTorch" \
  "4836d50e0fa48d7cdd415210f6c2c0e1acba5acb" \
  "phonemizer/zh/lexicon.json" \
  "f43304c9c2426545f8491c89ba235bab9e5bd740fdd42c4eeaca6df216f20735"
