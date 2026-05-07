#!/usr/bin/env bash
# package-release-artifacts.sh
#
# Packages the currently committed native libs into release artifact tarballs
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
#   phonemizer-android-arm64-v8a.tar.gz + .sha256
#   phonemizer-android-x86_64.tar.gz   + .sha256
#   vulkan-android-arm64-v8a.tar.gz + .sha256
#   vulkan-android-x86_64.tar.gz   + .sha256
#   core-ios.tar.gz       + .sha256
#   phonemizer-ios.tar.gz + .sha256
#   xnnpack-ios.tar.gz    + .sha256
#   coreml-ios.tar.gz     + .sha256
#
# Note: iOS OpenCV is provided via CocoaPods (opencv-rne), not a tarball.
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

# ---- Android ----------------------------------------------------------------

echo ""
echo "Android:"

package_merged "core-android-arm64-v8a" \
  "executorch/arm64-v8a"    "$ANDROID_LIBS/executorch/arm64-v8a" \
  "pthreadpool/arm64-v8a"   "$ANDROID_LIBS/pthreadpool/arm64-v8a" \
  "cpuinfo/arm64-v8a"       "$ANDROID_LIBS/cpuinfo/arm64-v8a"

package_merged "core-android-x86_64" \
  "executorch/x86_64"       "$ANDROID_LIBS/executorch/x86_64"

package_merged "opencv-android-arm64-v8a" \
  "opencv/arm64-v8a"              "$ANDROID_LIBS/opencv/arm64-v8a" \
  "opencv-third-party/arm64-v8a"  "$ANDROID_LIBS/opencv-third-party/arm64-v8a"

package_merged "opencv-android-x86_64" \
  "opencv/x86_64"           "$ANDROID_LIBS/opencv/x86_64"

package_merged "phonemizer-android-arm64-v8a" \
  "phonemis/arm64-v8a"      "$ANDROID_LIBS/phonemis/arm64-v8a"

package_merged "phonemizer-android-x86_64" \
  "phonemis/x86_64"         "$ANDROID_LIBS/phonemis/x86_64"

# XNNPACK is baked into libexecutorch.so on Android (no separate tarball).
# Vulkan ships as a standalone shared library (opt-in via the `vulkan` extra).
package_file "vulkan-android-arm64-v8a" \
  "executorch/arm64-v8a"    "$ANDROID_LIBS/executorch/arm64-v8a/libvulkan_executorch_backend.so"

package_file "vulkan-android-x86_64" \
  "executorch/x86_64"       "$ANDROID_LIBS/executorch/x86_64/libvulkan_executorch_backend.so"

# ---- iOS --------------------------------------------------------------------
# Note: OpenCV for iOS is provided by CocoaPods (opencv-rne dependency).
# No opencv-ios tarball is needed.

echo ""
echo "iOS:"

package_merged "core-ios" \
  "ExecutorchLib.xcframework"  "$IOS_DIR/ExecutorchLib.xcframework" \
  "libs/executorch"            "$IOS_DIR/libs/executorch" \
  "libs/pthreadpool"           "$IOS_DIR/libs/pthreadpool" \
  "libs/cpuinfo"               "$IOS_DIR/libs/cpuinfo"

package_merged "phonemizer-ios" \
  "libs/phonemis"              "$IOS_DIR/libs/phonemis"

package_merged "xnnpack-ios" \
  "XnnpackBackend.xcframework" "$IOS_DIR/XnnpackBackend.xcframework"

package_merged "coreml-ios" \
  "CoreMLBackend.xcframework"  "$IOS_DIR/CoreMLBackend.xcframework"

# ---- Summary ----------------------------------------------------------------

echo ""
echo "Done. Artifacts written to dist-artifacts/:"
ls -lh "$OUT"
echo ""
echo "Upload these files to the GitHub Release for v$VERSION:"
echo "  https://github.com/software-mansion/react-native-executorch/releases/tag/v$VERSION"
