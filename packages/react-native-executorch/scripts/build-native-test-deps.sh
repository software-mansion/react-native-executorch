#!/usr/bin/env bash
#
# Builds the host-side dependencies the C++ unit tests link against:
#
#   * Hermes    -- the JS engine RN ships. The package's native code is entirely
#                  JSI-facing, so a real runtime is what makes it callable at
#                  all. Hermes vendors JSI, so this covers both.
#   * ExecuTorch -- a minimal host build (no backends, no kernels beyond
#                  portable) providing tensor creation, module loading and the
#                  LLM tokenizers.
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
# third-party/include is vendored from (headers.tar.gz). A mismatch shows up as
# link errors or, worse, ABI drift at runtime.
EXECUTORCH_VERSION="v1.3.1"
EXECUTORCH_REPO="https://github.com/pytorch/executorch.git"

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
cmake -S "${DEPS_DIR}/executorch" -B "${DEPS_DIR}/executorch-build" -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
  -DEXECUTORCH_BUILD_EXTENSION_TENSOR=ON \
  -DEXECUTORCH_BUILD_EXTENSION_MODULE=ON \
  -DEXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON \
  -DEXECUTORCH_BUILD_EXTENSION_NAMED_DATA_MAP=ON \
  -DEXECUTORCH_BUILD_EXTENSION_FLAT_TENSOR=ON \
  -DEXECUTORCH_BUILD_EXTENSION_LLM=ON \
  -DEXECUTORCH_BUILD_PYBINDINGS=OFF \
  -DEXECUTORCH_BUILD_XNNPACK=OFF \
  -DEXECUTORCH_BUILD_TESTS=OFF
cmake --build "${DEPS_DIR}/executorch-build" \
  --target executorch extension_tensor extension_module_static tokenizers -j "${JOBS}"

echo
echo "Test dependencies ready in ${DEPS_DIR}"
