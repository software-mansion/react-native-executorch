#!/usr/bin/env bash
#
# Configures, builds and runs the C++ unit tests.
#
# Usage:
#   scripts/run-native-tests.sh                # build + run everything
#   scripts/run-native-tests.sh -R MathOpsTest # only suites matching a regex
#
# Any additional arguments are forwarded to ctest.
#
# Prerequisites, both of which this script checks for and explains:
#   * third-party/include -- RNET_HEADERS_ONLY=1 node scripts/download-libs.js
#   * .native-test-deps   -- scripts/build-native-test-deps.sh
#
# Environment:
#   BUILD_DIR=/path      -- build directory (default: cpp/tests/build)
#   BUILD_TYPE=Debug     -- CMake build type (default: Debug, for usable asserts)
#   RNE_TESTS_ENABLE_OPENCV=OFF -- skip the OpenCV-dependent suites
#   JOBS=8               -- parallelism (defaults to the CPU count)
set -euo pipefail

cd "$(dirname "$0")/.."
PACKAGE_DIR="$(pwd)"
REPO_ROOT="${PACKAGE_DIR}/../.."

BUILD_DIR="${BUILD_DIR:-${PACKAGE_DIR}/cpp/tests/build}"
BUILD_TYPE="${BUILD_TYPE:-Debug}"
ENABLE_OPENCV="${RNE_TESTS_ENABLE_OPENCV:-ON}"
JOBS="${JOBS:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}"

if [ ! -d "${PACKAGE_DIR}/third-party/include" ]; then
  echo "error: third-party/include is missing. Provision the headers with:" >&2
  echo "  RNET_HEADERS_ONLY=1 node scripts/download-libs.js" >&2
  exit 1
fi

if [ ! -d "${PACKAGE_DIR}/.native-test-deps" ]; then
  echo "error: test dependencies are missing. Build them once with:" >&2
  echo "  scripts/build-native-test-deps.sh" >&2
  exit 1
fi

if [ ! -f "${REPO_ROOT}/third-party/googletest/CMakeLists.txt" ]; then
  echo "error: googletest submodule is empty. Initialise it with:" >&2
  echo "  git submodule update --init third-party/googletest" >&2
  exit 1
fi

# The .pte fixture is small and the fetch is a checksum-verified no-op once it
# is present, so provision it here rather than making it another manual step.
# Set RNE_SKIP_FIXTURES=1 to work offline; the suites that need it are then
# dropped from the build with a warning.
if [ "${RNE_SKIP_FIXTURES:-}" != "1" ]; then
  "${PACKAGE_DIR}/scripts/fetch-test-fixtures.sh"
fi

cmake -S "${PACKAGE_DIR}/cpp/tests" -B "${BUILD_DIR}" -GNinja \
  -DCMAKE_BUILD_TYPE="${BUILD_TYPE}" \
  -DRNE_TESTS_ENABLE_OPENCV="${ENABLE_OPENCV}"

cmake --build "${BUILD_DIR}" -j "${JOBS}"

cd "${BUILD_DIR}"
# --output-on-failure keeps passing runs quiet but prints the full gtest report
# for anything that fails, which is what CI logs need.
exec ctest --output-on-failure "$@"
