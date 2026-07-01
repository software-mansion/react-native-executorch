#!/bin/bash

# Exit on error
set -e

# Print usage instructions if the correct arguments are not passed
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <path_to_opencv_android_sdk> <path_to_opencv_ios_framework>"
    echo "Example: $0 ~/Downloads/OpenCV-android-sdk ~/Downloads/opencv2.xcframework"
    exit 1
fi

ANDROID_SDK_DIR="$1"
IOS_FRAMEWORK="$2"

DEST_INCLUDE="third-party/include"
DEST_ANDROID="third-party/android/jniLibs"
DEST_IOS="third-party/ios/Frameworks"

# 1. Copy Android / Core C++ headers to third-party/include/opencv2
if [ -d "$ANDROID_SDK_DIR/sdk/native/jni/include/opencv2" ]; then
    echo "Syncing OpenCV header files to $DEST_INCLUDE..."
    mkdir -p "$DEST_INCLUDE"
    rm -rf "$DEST_INCLUDE/opencv2"
    cp -R "$ANDROID_SDK_DIR/sdk/native/jni/include/opencv2" "$DEST_INCLUDE/"
else
    echo "Error: Could not find opencv2 headers in '$ANDROID_SDK_DIR/sdk/native/jni/include/'"
    exit 1
fi

# 2. Copy Android shared libraries to third-party/android/jniLibs
if [ -d "$ANDROID_SDK_DIR/sdk/native/libs" ]; then
    echo "Syncing Android OpenCV precompiled libraries to $DEST_ANDROID..."
    mkdir -p "$DEST_ANDROID"
    
    # Sync arm64-v8a (Physical arm64 Android devices)
    if [ -d "$ANDROID_SDK_DIR/sdk/native/libs/arm64-v8a" ]; then
        mkdir -p "$DEST_ANDROID/arm64-v8a"
        cp "$ANDROID_SDK_DIR/sdk/native/libs/arm64-v8a/libopencv_java4.so" "$DEST_ANDROID/arm64-v8a/"
        echo "  - Added arm64-v8a library"
    fi
    
    # Sync x86_64 (Intel Android emulators)
    if [ -d "$ANDROID_SDK_DIR/sdk/native/libs/x86_64" ]; then
        mkdir -p "$DEST_ANDROID/x86_64"
        cp "$ANDROID_SDK_DIR/sdk/native/libs/x86_64/libopencv_java4.so" "$DEST_ANDROID/x86_64/"
        echo "  - Added x86_64 library"
    fi
    
    # Sync armeabi-v7a (Older arm Android devices)
    if [ -d "$ANDROID_SDK_DIR/sdk/native/libs/armeabi-v7a" ]; then
        mkdir -p "$DEST_ANDROID/armeabi-v7a"
        cp "$ANDROID_SDK_DIR/sdk/native/libs/armeabi-v7a/libopencv_java4.so" "$DEST_ANDROID/armeabi-v7a/"
        echo "  - Added armeabi-v7a library"
    fi
else
    echo "Error: Could not find libraries folder in '$ANDROID_SDK_DIR/sdk/native/libs'"
    exit 1
fi

# 3. Copy iOS framework to third-party/ios/Frameworks
if [ -d "$IOS_FRAMEWORK" ]; then
    FRAMEWORK_NAME=$(basename "$IOS_FRAMEWORK")
    echo "Syncing iOS framework ($FRAMEWORK_NAME) to $DEST_IOS..."
    mkdir -p "$DEST_IOS"
    rm -rf "$DEST_IOS/$FRAMEWORK_NAME"
    cp -R "$IOS_FRAMEWORK" "$DEST_IOS/"
    echo "  - Copied $FRAMEWORK_NAME"
else
    echo "Error: Could not find iOS framework directory at '$IOS_FRAMEWORK'"
    exit 1
fi

echo "✅ OpenCV headers and libraries successfully vendored!"
