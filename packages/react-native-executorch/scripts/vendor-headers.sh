#!/usr/bin/env bash
# vendor-headers.sh
#
# Assembles the platform-independent C/C++ header tree that ships as the
# `headers` release artifact (headers.tar.gz) and is consumed by the iOS
# podspec + android/CMakeLists.txt include paths.
#
# The header surface spans FOUR sources (which is why a hand copy of the
# executorch CMake *install* tree alone is incomplete — it omits the
# source-only headers such as extension/llm/{runner,custom_ops,apple}):
#
#   1. ExecuTorch C++ source headers          ($ET/{runtime,extension,...})
#   2. Build-generated flatbuffer headers      ($ET/cmake-out*/**/*_generated.h)
#   3. pytorch c10 / torch headers             (assembled xcframework Headers)
#   4. XNNPACK/threadpool loose deps + opencv2  (install include root / opencv)
#
# Usage:
#   ./scripts/vendor-headers.sh <executorch-dir> <opencv-include-dir> [out-dir]
#
#   <executorch-dir>      a built software-mansion-labs/executorch@ms/separate-backends
#                         checkout (needs cmake-out* dirs for the generated headers
#                         and the assembled cmake-out/executorch.xcframework).
#   <opencv-include-dir>  a directory containing `opencv2/` (the OpenCV prebuilt SDK
#                         headers; same source as the opencv-rne pod). OpenCV is not
#                         built from executorch.
#   [out-dir]             defaults to <package>/third-party/include.
#
# Re-run scripts/package-release-artifacts.sh afterwards to pack headers.tar.gz.

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <executorch-dir> <opencv-include-dir> [out-dir]" >&2
  exit 1
fi

ET="$(cd "$1" && pwd)"
OPENCV_INC="$(cd "$2" && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="${3:-$PACKAGE_ROOT/third-party/include}"

HDR_INCLUDES=(--include='*/' --include='*.h' --include='*.hpp' --include='*.cuh' --include='*.inc' --exclude='*')

echo "Vendoring headers"
echo "  executorch : $ET"
echo "  opencv     : $OPENCV_INC"
echo "  out        : $OUT"

rm -rf "$OUT"
mkdir -p "$OUT/executorch"

# --- 1. ExecuTorch C++ source headers ---------------------------------------
# The executorch repo root IS the `executorch/` include namespace. These source
# subtrees carry the full public C++ surface, including the LLM runner helpers
# (extension/llm/{runner,custom_ops,apple,sampler}) and the bundled tokenizer
# third-party headers under extension/llm/tokenizers/third-party/.
echo "  [1/4] executorch source headers"
for sub in runtime extension kernels configurations backends schema devtools; do
  [ -d "$ET/$sub" ] || continue
  rsync -am "${HDR_INCLUDES[@]}" "$ET/$sub/" "$OUT/executorch/$sub/"
done

# --- 2. Build-generated / installed headers ---------------------------------
# The build emits headers that are NOT in the source tree: flatbuffer
# *_generated.h plus codegen'd kernel bindings (kernels/*/Functions.h,
# NativeFunctions.h). Overlay the whole install include/executorch tree on top
# of the source copy (same-named files are identical; this only adds).
echo "  [2/4] generated + installed executorch headers"
for inst in "$ET"/cmake-out*/include "$ET"/cmake-out*/schema/include "$ET"/cmake-out*/devtools/include; do
  [ -d "$inst/executorch" ] || continue
  rsync -am "${HDR_INCLUDES[@]}" "$inst/executorch/" "$OUT/executorch/"
done

# --- 3. pytorch c10 / torch headers -----------------------------------------
# c10 (scalar types etc.) and torch/headeronly are referenced as <c10/...> and
# <torch/...>. The assembled xcframework Headers carry a clean copy.
echo "  [3/4] c10 / torch headers"
XCH="$ET/cmake-out/executorch.xcframework/ios-arm64/Headers"
if [ ! -d "$XCH/c10" ]; then
  echo "    ✗ expected c10 headers at $XCH/c10 (run build_apple_frameworks.sh first)" >&2
  exit 1
fi
rsync -am "${HDR_INCLUDES[@]}" "$XCH/c10/"   "$OUT/c10/"
rsync -am "${HDR_INCLUDES[@]}" "$XCH/torch/" "$OUT/torch/"
# torch/headeronly is also referenced as a top-level <headeronly/...> include root.
[ -d "$XCH/torch/headeronly" ] && rsync -am "${HDR_INCLUDES[@]}" "$XCH/torch/headeronly/" "$OUT/headeronly/"

# --- 4. XNNPACK/threadpool loose deps + opencv2 -----------------------------
# Backend/tokenizer code includes <cpuinfo.h>, <pthreadpool.h>, <xnnpack.h>,
# <fxdiv.h>, <pcre2.h> directly. They sit at the install include root, not under
# executorch/. opencv2 ships from the OpenCV prebuilt (not executorch).
echo "  [4/4] loose deps + opencv2"
for root in "$ET"/cmake-out*/include; do
  [ -d "$root" ] || continue
  for f in cpuinfo.h pthreadpool.h xnnpack.h fxdiv.h pcre2.h pcre2posix.h; do
    [ -f "$root/$f" ] && cp "$root/$f" "$OUT/"
  done
  [ -d "$root/kai" ] && rsync -am "${HDR_INCLUDES[@]}" "$root/kai/" "$OUT/kai/"
  # The install tree also exposes the tokenizer third-party deps at the include
  # root (absl/, re2/, nlohmann/). Keep them here too so <absl/...>/<re2/...>/
  # <nlohmann/...> resolve via the root -I, in addition to the nested copies the
  # tokenizer build references under .../tokenizers/third-party/.
  for d in absl re2 nlohmann; do
    [ -d "$root/$d" ] && rsync -am "${HDR_INCLUDES[@]}" "$root/$d/" "$OUT/$d/"
  done
done
if [ ! -d "$OPENCV_INC/opencv2" ]; then
  echo "    ✗ no opencv2/ under $OPENCV_INC" >&2
  exit 1
fi
rsync -am "${HDR_INCLUDES[@]}" "$OPENCV_INC/opencv2/" "$OUT/opencv2/"

echo "Done. $(find "$OUT" -type f | wc -l | tr -d ' ') headers in $OUT"
