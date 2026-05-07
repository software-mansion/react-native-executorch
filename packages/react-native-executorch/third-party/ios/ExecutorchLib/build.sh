#!/bin/bash

# Builds ExecutorchLib.xcframework for iOS and iOS Simulator, plus separate
# static xcframeworks for optional backends (xnnpack, coreml).
#
# This script:
# 1. Cleans previous builds
# 2. Archives the framework for iOS device (arm64)
# 3. Archives the framework for iOS Simulator (arm64)
# 4. Combines both archives into a single .xcframework
# 5. Creates XnnpackBackend.xcframework from the backend .a files
# 6. Creates CoreMLBackend.xcframework from the backend .a files
#
# Output:
#   ./output/ExecutorchLib.xcframework
#   ./output/XnnpackBackend.xcframework
#   ./output/CoreMLBackend.xcframework
#
# Usage: ./build.sh

set -euo pipefail

# --- Configuration ---
PROJECT_NAME="ExecutorchLib"
SCHEME_NAME="ExecutorchLib"
OUTPUT_FOLDER="output"
LIBS_DIR="$(pwd)/../../../third-party/ios/libs/executorch"

# --- Derived Variables ---
BUILD_FOLDER="build"
ARCHIVE_PATH_IOS="$BUILD_FOLDER/$SCHEME_NAME-iOS"
ARCHIVE_PATH_SIMULATOR="$BUILD_FOLDER/$SCHEME_NAME-iOS_Simulator"
FRAMEWORK_NAME="$SCHEME_NAME.framework"
XCFRAMEWORK_NAME="$SCHEME_NAME.xcframework"
XCFRAMEWORK_PATH="$OUTPUT_FOLDER/$XCFRAMEWORK_NAME"

# --- Script ---
rm -rf "$BUILD_FOLDER" "$OUTPUT_FOLDER"
mkdir -p "$OUTPUT_FOLDER"

xcodebuild clean -project "$PROJECT_NAME.xcodeproj" -scheme "$SCHEME_NAME"

xcodebuild archive \
  -project "$PROJECT_NAME.xcodeproj" \
  -scheme "$SCHEME_NAME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH_IOS" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  CODE_SIGNING_ALLOWED=NO

xcodebuild archive \
  -project "$PROJECT_NAME.xcodeproj" \
  -scheme "$SCHEME_NAME" \
  -configuration Release \
  -destination "generic/platform=iOS Simulator" \
  -archivePath "$ARCHIVE_PATH_SIMULATOR" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  CODE_SIGNING_ALLOWED=NO

xcodebuild -create-xcframework \
  -framework "$ARCHIVE_PATH_IOS.xcarchive/Products/Library/Frameworks/$FRAMEWORK_NAME" \
  -framework "$ARCHIVE_PATH_SIMULATOR.xcarchive/Products/Library/Frameworks/$FRAMEWORK_NAME" \
  -output "$XCFRAMEWORK_PATH"

# --- Build XnnpackBackend.xcframework ---
# CocoaPods requires matching binary names across slices
STAGING=$(mktemp -d)
mkdir -p "$STAGING/ios" "$STAGING/sim"
cp "$LIBS_DIR/libbackend_xnnpack_ios.a" "$STAGING/ios/libXnnpackBackend.a"
cp "$LIBS_DIR/libbackend_xnnpack_simulator.a" "$STAGING/sim/libXnnpackBackend.a"
xcodebuild -create-xcframework \
  -library "$STAGING/ios/libXnnpackBackend.a" \
  -library "$STAGING/sim/libXnnpackBackend.a" \
  -output "$OUTPUT_FOLDER/XnnpackBackend.xcframework"

# --- Build CoreMLBackend.xcframework ---
cp "$LIBS_DIR/libbackend_coreml_ios.a" "$STAGING/ios/libCoreMLBackend.a"
cp "$LIBS_DIR/libbackend_coreml_simulator.a" "$STAGING/sim/libCoreMLBackend.a"
xcodebuild -create-xcframework \
  -library "$STAGING/ios/libCoreMLBackend.a" \
  -library "$STAGING/sim/libCoreMLBackend.a" \
  -output "$OUTPUT_FOLDER/CoreMLBackend.xcframework"
rm -rf "$STAGING"

echo "Done! Output:"
echo "  $OUTPUT_FOLDER/ExecutorchLib.xcframework"
echo "  $OUTPUT_FOLDER/XnnpackBackend.xcframework"
echo "  $OUTPUT_FOLDER/CoreMLBackend.xcframework"
