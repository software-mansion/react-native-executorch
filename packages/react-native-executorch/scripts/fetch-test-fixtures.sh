#!/usr/bin/env bash
#
# Downloads the .pte fixtures the C++ model/schema tests load.
#
# Anything that reads ExecuTorch MethodMeta (schema::methodSpecFromMetadata,
# validateSpec, getUsedBackends, and ModelHostObject's whole load path) needs a
# real program to read it from. This fetches the smallest one the org publishes:
# selfie-segmentation, ~486 KB.
#
# Note this only covers *loading*. Executing the model additionally needs an
# XNNPACK host build, which these tests deliberately do not require — see
# cpp/tests/README.md.
#
# Pinned to an exact Hugging Face revision and verified against a recorded
# sha256, so a re-tag upstream cannot silently change what the tests assert.
# Idempotent: a no-op when the fixture is already present and matches.
#
# Usage:
#   scripts/fetch-test-fixtures.sh
set -euo pipefail

cd "$(dirname "$0")/.."

FIXTURE_DIR="cpp/tests/fixtures"

HF_REPO="software-mansion/react-native-executorch-selfie-segmentation"
HF_REVISION="13a9494d8230279b47973b91c94b1aa902d307a6"
HF_PATH="xnnpack/selfie_segmentation_xnnpack_fp32.pte"
FIXTURE_NAME="selfie_segmentation_xnnpack_fp32.pte"
FIXTURE_SHA256="176aba6a0719b56391586a3d19396315305c7adb5c16aafda350fecc596cebf9"

target="${FIXTURE_DIR}/${FIXTURE_NAME}"

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

if [ -f "$target" ] && [ "$(sha256_of "$target")" = "$FIXTURE_SHA256" ]; then
  echo "✓ ${FIXTURE_NAME} already present"
  exit 0
fi

mkdir -p "$FIXTURE_DIR"
url="https://huggingface.co/${HF_REPO}/resolve/${HF_REVISION}/${HF_PATH}"
echo "↓ ${url}"
curl -fsSL -o "${target}.tmp" "$url"

actual="$(sha256_of "${target}.tmp")"
if [ "$actual" != "$FIXTURE_SHA256" ]; then
  rm -f "${target}.tmp"
  echo "error: checksum mismatch for ${FIXTURE_NAME}" >&2
  echo "  expected ${FIXTURE_SHA256}" >&2
  echo "  actual   ${actual}" >&2
  exit 1
fi

mv "${target}.tmp" "$target"
echo "✓ ${FIXTURE_NAME} ready"
