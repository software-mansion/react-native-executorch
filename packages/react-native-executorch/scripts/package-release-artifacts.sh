#!/usr/bin/env bash
# package-release-artifacts.sh
#
# Packages the locally-staged native libs into release artifact tarballs
# ready to be uploaded to GitHub Releases.
#
# Run from the package root (packages/react-native-executorch/):
#   ./scripts/package-release-artifacts.sh
#
# Output: dist-artifacts/
#   core-android-arm64-v8a.tar.gz + .sha256
#   core-android-x86_64.tar.gz   + .sha256
#   opencv-android-arm64-v8a.tar.gz + .sha256
#   opencv-android-x86_64.tar.gz   + .sha256
#   xnnpack-android-arm64-v8a.tar.gz + .sha256
#   xnnpack-android-x86_64.tar.gz   + .sha256
#   vulkan-android-arm64-v8a.tar.gz + .sha256
#   vulkan-android-x86_64.tar.gz   + .sha256
#   core-ios.tar.gz       + .sha256
#   xnnpack-ios.tar.gz    + .sha256
#   coreml-ios.tar.gz     + .sha256
#   mlx-ios.tar.gz        + .sha256 (device-slice xcframework + mlx.metallib resource)
#
# Note: phonemis ships as in-tree source (third-party/common/phonemis submodule),
# not as a tarball.
#
# Note: iOS OpenCV is provided via CocoaPods (opencv-rne), not a tarball.
#
# Note: MLX ships the iOS device slice only — the iOS simulator cannot drive
# MLX-on-Metal, so no simulator slice is built or packaged.
#
# Testing the download flow
# -------------------------
# Option A — local HTTP server (no GitHub needed):
#   cd dist-artifacts && python3 -m http.server 8080
#   RNET_BASE_URL=http://localhost:8080 INIT_CWD=<repo-root> node scripts/download-libs.js
#
# Option B — GitHub pre-release:
#   gh release create v0.9.0-libs-test --prerelease --title "libs test" \
#     --notes "Test release, will be deleted." \
#     --repo software-mansion/react-native-executorch
#   gh release upload v0.9.0-libs-test dist-artifacts/* \
#     --repo software-mansion/react-native-executorch
#   RNET_BASE_URL=https://github.com/software-mansion/react-native-executorch/releases/download/v0.9.0-libs-test \
#     INIT_CWD=<repo-root> node scripts/download-libs.js
#   # cleanup:
#   gh release delete v0.9.0-libs-test --repo software-mansion/react-native-executorch --yes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_LIBS="$PACKAGE_ROOT/third-party/android/libs"
IOS_DIR="$PACKAGE_ROOT/third-party/ios"
OUT="$PACKAGE_ROOT/dist-artifacts"

INCLUDE_DIR="$PACKAGE_ROOT/third-party/include"
VERSION=$(node -p "require('$PACKAGE_ROOT/package.json').version")

echo "Packaging release artifacts for v$VERSION"
mkdir -p "$OUT"

# ---- Helpers ----------------------------------------------------------------

package() {
  local name=$1
  local src_dir=$2
  local out_file="$OUT/$name.tar.gz"

  echo "  → $name"

  if [ ! -d "$src_dir" ]; then
    echo "    ✗ Source directory not found: $src_dir" >&2
    exit 1
  fi

  tar -czf "$out_file" -C "$src_dir" .
  shasum -a 256 "$out_file" | awk '{print $1}' > "$out_file.sha256"
  echo "    ✓ $(du -sh "$out_file" | cut -f1)"
}

# Packages a single file into a tarball, placing it at the given relative path.
#   package_file <name> <rel_path> <src_file>
package_file() {
  local name=$1
  local rel_path=$2   # directory path inside the tarball
  local src_file=$3   # full path to the source file
  local out_file="$OUT/$name.tar.gz"
  local tmp
  tmp=$(mktemp -d)

  echo "  → $name"

  if [ ! -f "$src_file" ]; then
    echo "    ✗ Source file not found: $src_file" >&2
    rm -rf "$tmp"
    exit 1
  fi

  mkdir -p "$tmp/$rel_path"
  cp "$src_file" "$tmp/$rel_path/"

  tar -czf "$out_file" -C "$tmp" .
  shasum -a 256 "$out_file" | awk '{print $1}' > "$out_file.sha256"
  echo "    ✓ $(du -sh "$out_file" | cut -f1)"
  rm -rf "$tmp"
}

# Packages multiple source directories into a single tarball by staging them
# into a temp directory first, preserving relative paths.
package_merged() {
  local name=$1
  shift
  local out_file="$OUT/$name.tar.gz"
  local tmp
  tmp=$(mktemp -d)

  echo "  → $name"

  while [[ $# -gt 0 ]]; do
    local rel_path=$1   # relative path inside the tarball
    local src=$2        # source directory to copy from
    shift 2

    if [ ! -d "$src" ]; then
      echo "    ✗ Source directory not found: $src" >&2
      rm -rf "$tmp"
      exit 1
    fi

    mkdir -p "$tmp/$rel_path"
    cp -r "$src/." "$tmp/$rel_path/"
  done

  tar -czf "$out_file" -C "$tmp" .
  shasum -a 256 "$out_file" | awk '{print $1}' > "$out_file.sha256"
  echo "    ✓ $(du -sh "$out_file" | cut -f1)"
  rm -rf "$tmp"
}

# ---- Headers ----------------------------------------------------------------
# Platform-independent ExecuTorch + c10 + torch + tokenizers + opencv headers.
# Staged under include/ so the tarball extracts to third-party/include/.
#
# third-party/include/ must first be assembled by scripts/vendor-headers.sh
# (the executorch header surface spans the source tree, the build-generated
# headers, the xcframework c10/torch, and opencv — a copy of the install tree
# alone is incomplete, e.g. it omits extension/llm/{runner,custom_ops}).

if [ ! -d "$INCLUDE_DIR/executorch/extension/llm/runner" ]; then
  echo "  ✗ $INCLUDE_DIR looks incomplete (no extension/llm/runner)." >&2
  echo "    Run scripts/vendor-headers.sh <executorch-dir> <opencv-include-dir> first." >&2
  exit 1
fi

echo ""
echo "Headers:"

package_merged "headers" \
  "include"   "$INCLUDE_DIR"

# ---- Android ----------------------------------------------------------------

echo ""
echo "Android:"

# core-android bundles the per-ABI executorch .so. pthreadpool + cpuinfo are
# statically linked into libexecutorch.so (not shipped separately). The
# ABI-independent executorch.jar (ExecuTorch Java API for the JNI bridge) rides
# along in the arm64 core tarball, which is always downloaded.
echo "  → core-android-arm64-v8a"
_ca_tmp=$(mktemp -d)
mkdir -p "$_ca_tmp/executorch/arm64-v8a"
cp -r "$ANDROID_LIBS/executorch/arm64-v8a/." "$_ca_tmp/executorch/arm64-v8a/"
cp "$ANDROID_LIBS/executorch.jar" "$_ca_tmp/executorch.jar"
tar -czf "$OUT/core-android-arm64-v8a.tar.gz" -C "$_ca_tmp" .
shasum -a 256 "$OUT/core-android-arm64-v8a.tar.gz" | awk '{print $1}' > "$OUT/core-android-arm64-v8a.tar.gz.sha256"
echo "    ✓ $(du -sh "$OUT/core-android-arm64-v8a.tar.gz" | cut -f1)"
rm -rf "$_ca_tmp"

package_merged "core-android-x86_64" \
  "executorch/x86_64"       "$ANDROID_LIBS/executorch/x86_64"

package_merged "opencv-android-arm64-v8a" \
  "opencv/arm64-v8a"              "$ANDROID_LIBS/opencv/arm64-v8a" \
  "opencv-third-party/arm64-v8a"  "$ANDROID_LIBS/opencv-third-party/arm64-v8a"

package_merged "opencv-android-x86_64" \
  "opencv/x86_64"           "$ANDROID_LIBS/opencv/x86_64"

# phonemis is built from in-tree source (third-party/common/phonemis submodule);
# no Android tarball is produced.

# XNNPACK and Vulkan each ship as standalone shared libraries (opt-in backends).
package_file "xnnpack-android-arm64-v8a" \
  "executorch/arm64-v8a"    "$ANDROID_LIBS/executorch/arm64-v8a/libxnnpack_executorch_backend.so"

package_file "xnnpack-android-x86_64" \
  "executorch/x86_64"       "$ANDROID_LIBS/executorch/x86_64/libxnnpack_executorch_backend.so"

package_file "vulkan-android-arm64-v8a" \
  "executorch/arm64-v8a"    "$ANDROID_LIBS/executorch/arm64-v8a/libvulkan_executorch_backend.so"

package_file "vulkan-android-x86_64" \
  "executorch/x86_64"       "$ANDROID_LIBS/executorch/x86_64/libvulkan_executorch_backend.so"

# ---- iOS --------------------------------------------------------------------
# Note: OpenCV for iOS is provided by CocoaPods (opencv-rne dependency).
# No opencv-ios tarball is needed.

echo ""
echo "iOS:"

# pthreadpool + cpuinfo are bundled into libthreadpool_*.a (in libs/executorch),
# so no separate libs/pthreadpool or libs/cpuinfo dirs are shipped.
package_merged "core-ios" \
  "ExecutorchLib.xcframework"  "$IOS_DIR/ExecutorchLib.xcframework" \
  "libs/executorch"            "$IOS_DIR/libs/executorch"

# phonemis is built from in-tree source (third-party/common/phonemis submodule);
# no iOS tarball is produced.

package_merged "xnnpack-ios" \
  "XnnpackBackend.xcframework" "$IOS_DIR/XnnpackBackend.xcframework"

package_merged "coreml-ios" \
  "CoreMLBackend.xcframework"  "$IOS_DIR/CoreMLBackend.xcframework"

# MLX ships a device-only xcframework plus a separate mlx.metallib that must
# land in the app bundle at runtime (pod Resource via podspec). The iOS
# simulator cannot drive MLX-on-Metal, so no simulator slice exists. Stage both
# into one tarball.
echo "  → mlx-ios"
_mlx_tmp=$(mktemp -d)
if [ ! -d "$IOS_DIR/MLXBackend.xcframework" ]; then
  echo "    ✗ Source directory not found: $IOS_DIR/MLXBackend.xcframework" >&2
  exit 1
fi
if [ ! -f "$IOS_DIR/libs/executorch/mlx.metallib" ]; then
  echo "    ✗ Source file not found: $IOS_DIR/libs/executorch/mlx.metallib" >&2
  exit 1
fi
mkdir -p "$_mlx_tmp/MLXBackend.xcframework"
cp -r "$IOS_DIR/MLXBackend.xcframework/." "$_mlx_tmp/MLXBackend.xcframework/"
mkdir -p "$_mlx_tmp/libs/executorch"
cp "$IOS_DIR/libs/executorch/mlx.metallib" "$_mlx_tmp/libs/executorch/"
tar -czf "$OUT/mlx-ios.tar.gz" -C "$_mlx_tmp" .
shasum -a 256 "$OUT/mlx-ios.tar.gz" | awk '{print $1}' > "$OUT/mlx-ios.tar.gz.sha256"
echo "    ✓ $(du -sh "$OUT/mlx-ios.tar.gz" | cut -f1)"
rm -rf "$_mlx_tmp"

# ---- Summary ----------------------------------------------------------------

echo ""
echo "Done. Artifacts written to dist-artifacts/:"
ls -lh "$OUT"
echo ""
echo "Upload these files to the GitHub Release for v$VERSION:"
echo "  https://github.com/software-mansion/react-native-executorch/releases/tag/v$VERSION"
