#!/usr/bin/env bash
#
# Builds the host-side dependencies the C++ unit tests link against:
#
#   * Hermes    -- the JS engine RN ships. The package's native code is entirely
#                  JSI-facing, so a real runtime is what makes it callable at
#                  all. Hermes vendors JSI, so this covers both.
#   * ExecuTorch -- a minimal host build (no backends, no kernels beyond
#                  portable) providing tensor creation, module loading, the LLM
#                  tokenizers and the LLM runner the llm extension wraps.
#
# Both land in .native-test-deps/ next to the package, which is gitignored and
# safe for CI to cache wholesale — the pinned versions below are the cache key.
# Re-running is cheap: each build is incremental and a no-op when up to date.
#
# Usage:
#   scripts/build-native-test-deps.sh [--clean]
#
# Environment:
#   RNE_TEST_DEPS_DIR=/path   -- override the output directory
#   JOBS=8                    -- parallelism (defaults to the CPU count)
set -euo pipefail

# Keep HERMES_VERSION in sync with node_modules/react-native/sdks/.hermesversion
# so the tests run on the same engine as the apps.
HERMES_VERSION="hermes-v0.14.1"
HERMES_REPO="https://github.com/facebook/hermes.git"

# Keep EXECUTORCH_VERSION in sync with the ExecuTorch release that
# third-party/include is vendored from — that is the release tagged
# `v${nativeLibsVersion}-libs` in package.json. A mismatch shows up as link
# errors or, worse, ABI drift at runtime. cpp/extensions/llm additionally reads
# private members of TextLLMRunner/MultimodalRunner, so a version skew there
# fails to compile rather than silently misbehaving.
EXECUTORCH_VERSION="v1.3.1"
EXECUTORCH_REPO="https://github.com/pytorch/executorch.git"

# The shipped native libraries are built from software-mansion-labs/executorch
# @rne-split-build, which is ExecuTorch 1.3.1 with the tokenizers submodule
# swapped for the fork below (it adds the WordPiece/Unigram models and the NFC
# normalizer that upstream has not taken). third-party/include carries that
# fork's headers, so linking upstream's libtokenizers.a here would compile
# against one class layout and link another — HFTokenizer::load then crashes
# inside setup_pretokenizer rather than failing to link. Swapping the submodule
# reproduces the shipped configuration with a single tokenizers in the build.
#
# Keep this commit in sync with the tokenizers submodule of the fork commit that
# produced the current headers.tar.gz.
TOKENIZERS_REPO="https://github.com/software-mansion-labs/pytorch-tokenizers.git"
TOKENIZERS_COMMIT="56a30afbe2e6b4ca881d0fb7b961b9f9da156be4"

cd "$(dirname "$0")/.."
PACKAGE_DIR="$(pwd)"

DEPS_DIR="${RNE_TEST_DEPS_DIR:-${PACKAGE_DIR}/.native-test-deps}"
JOBS="${JOBS:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}"

if [ "${1:-}" = "--clean" ]; then
  echo "Removing ${DEPS_DIR}"
  rm -rf "${DEPS_DIR}"
fi

for tool in cmake ninja git; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "error: '$tool' is required but not installed." >&2
    exit 127
  fi
done

# Clones a repo at an exact tag if it is not already present at that tag.
# Shallow, single-branch: the ExecuTorch tree is large and history is useless here.
clone_pinned() {
  local repo="$1" tag="$2" dest="$3" recurse="$4"
  local stamp="${dest}/.rne-pinned-version"

  if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$tag" ]; then
    echo "  ✓ ${dest##*/} already at ${tag}"
    return
  fi

  echo "  ↓ cloning ${repo} @ ${tag}"
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  if [ "$recurse" = "recurse" ]; then
    git clone --depth 1 --branch "$tag" --recurse-submodules --shallow-submodules "$repo" "$dest"
  else
    git clone --depth 1 --branch "$tag" "$repo" "$dest"
  fi
  echo "$tag" > "$stamp"
}

echo "==> Hermes (${HERMES_VERSION})"
clone_pinned "$HERMES_REPO" "$HERMES_VERSION" "${DEPS_DIR}/hermes/src" no
cmake -S "${DEPS_DIR}/hermes/src" -B "${DEPS_DIR}/hermes/build" -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DHERMES_BUILD_APPLE_FRAMEWORK=OFF \
  -DHERMES_ENABLE_TEST_SUITE=OFF \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
# `hermesvm` is the JSI-facing engine target; it pulls in the vendored jsi too.
cmake --build "${DEPS_DIR}/hermes/build" --target hermesvm -j "${JOBS}"

echo "==> ExecuTorch (${EXECUTORCH_VERSION})"
# ExecuTorch's CMake refuses to configure unless its source directory is named
# exactly `executorch` (pytorch/executorch#6475), hence the flat layout here
# rather than the src/build pair used for Hermes.
clone_pinned "$EXECUTORCH_REPO" "$EXECUTORCH_VERSION" "${DEPS_DIR}/executorch" recurse

# Swap in the fork's tokenizers, pinned by commit. A shallow fetch of one object
# rather than a clone: the fork's history is as large as upstream's.
TOKENIZERS_DIR="${DEPS_DIR}/executorch/extension/llm/tokenizers"
TOKENIZERS_STAMP="${TOKENIZERS_DIR}/.rne-pinned-version"
if [ ! -f "$TOKENIZERS_STAMP" ] || [ "$(cat "$TOKENIZERS_STAMP")" != "$TOKENIZERS_COMMIT" ]; then
  echo "  ↓ ${TOKENIZERS_REPO} @ ${TOKENIZERS_COMMIT}"
  rm -rf "$TOKENIZERS_DIR"
  mkdir -p "$TOKENIZERS_DIR"
  git -C "$TOKENIZERS_DIR" init -q
  git -C "$TOKENIZERS_DIR" remote add origin "$TOKENIZERS_REPO"
  git -C "$TOKENIZERS_DIR" fetch -q --depth 1 origin "$TOKENIZERS_COMMIT"
  git -C "$TOKENIZERS_DIR" checkout -q FETCH_HEAD
  git -C "$TOKENIZERS_DIR" submodule update --init --depth 1 --recursive
  echo "$TOKENIZERS_COMMIT" > "$TOKENIZERS_STAMP"
else
  echo "  ✓ tokenizers already at ${TOKENIZERS_COMMIT}"
fi

cmake -S "${DEPS_DIR}/executorch" -B "${DEPS_DIR}/executorch-build" -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
  -DEXECUTORCH_BUILD_EXTENSION_TENSOR=ON \
  -DEXECUTORCH_BUILD_EXTENSION_MODULE=ON \
  -DEXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON \
  -DEXECUTORCH_BUILD_EXTENSION_NAMED_DATA_MAP=ON \
  -DEXECUTORCH_BUILD_EXTENSION_FLAT_TENSOR=ON \
  -DEXECUTORCH_BUILD_EXTENSION_LLM=ON \
  -DEXECUTORCH_BUILD_EXTENSION_LLM_RUNNER=ON \
  -DEXECUTORCH_BUILD_PYBINDINGS=OFF \
  -DEXECUTORCH_BUILD_XNNPACK=OFF \
  -DEXECUTORCH_BUILD_TESTS=OFF
cmake --build "${DEPS_DIR}/executorch-build" \
  --target executorch extension_tensor extension_module_static tokenizers \
           extension_llm_runner -j "${JOBS}"

echo
echo "Test dependencies ready in ${DEPS_DIR}"
