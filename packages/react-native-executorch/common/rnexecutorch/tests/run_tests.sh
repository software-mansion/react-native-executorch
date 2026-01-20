#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$SCRIPT_DIR/../../.."
ANDROID_ABI="arm64-v8a"
ANDROID_LIBS_DIR="$PACKAGE_ROOT/third-party/android/libs"

echo "ANDROID_NDK = $ANDROID_NDK"
if [ -z "$ANDROID_NDK" ]; then
  echo "ERROR: ANDROID_NDK IS NOT SET"
  exit 1
fi

DEVICE_TEST_DIR="/data/local/tmp/rnexecutorch_tests"

# cleanup build artifacts
rm -rf build
mkdir build
cd build

# cross-compile tests with Android toolchain
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=$ANDROID_ABI \
  -DANDROID_PLATFORM=android-34 \
  -DANDROID_STL=c++_shared

make

adb shell "mkdir -p $DEVICE_TEST_DIR"

TEST_EXECUTABLES=("NumericalTests" "LogTests" "BaseModelTests" "ClassificationTests" "ObjectDetectionTests")

# push test executables to device
echo "Pushing test executables to device..."
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if [ -f "$test_exe" ]; then
    adb push "$test_exe" "$DEVICE_TEST_DIR/"
    adb shell "chmod +x $DEVICE_TEST_DIR/$test_exe"
  fi
done

# download models needed for the tests & push to device
wget https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/main/xnnpack/style_transfer_candy_xnnpack.pte
adb push "style_transfer_candy_xnnpack.pte" "$DEVICE_TEST_DIR/"

wget https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.6.0/xnnpack/efficientnet_v2_s_xnnpack.pte
adb push "efficientnet_v2_s_xnnpack.pte" "$DEVICE_TEST_DIR/"

wget https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.6.0/ssdlite320-mobilenetv3-large.pte
adb push "ssdlite320-mobilenetv3-large.pte" "$DEVICE_TEST_DIR/"

# download test image for classification/object detection tests
wget -O test_image.jpg https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg
adb push "test_image.jpg" "$DEVICE_TEST_DIR/"

# push shared libraries needed by BaseModelTests
echo "Pushing shared libraries to device..."
GRADLE_LIBS="$PACKAGE_ROOT/android/build/intermediates/cmake/release/obj/$ANDROID_ABI"

# Push executorch as libexecutorch_jni.so (the lib expects this name)
adb push "$ANDROID_LIBS_DIR/executorch/$ANDROID_ABI/libexecutorch.so" "$DEVICE_TEST_DIR/libexecutorch_jni.so"

# Push dependencies used by libexecutorch.so
for lib in libfbjni.so libpthreadpool.so libcpuinfo.so libc++_shared.so; do
  if [ -f "$GRADLE_LIBS/$lib" ]; then
    adb push "$GRADLE_LIBS/$lib" "$DEVICE_TEST_DIR/"
  else
    echo "Warning: $lib not found"
  fi
done

# run tests on device
echo "Running tests on device..."
FAILED=0
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if adb shell "[ -f $DEVICE_TEST_DIR/$test_exe ]"; then
    echo "=== Running $test_exe ==="
    if ! adb shell "cd $DEVICE_TEST_DIR && LD_LIBRARY_PATH=. ./$test_exe --gtest_color=yes"; then
      FAILED=1
    fi
  fi
done

# cleanup device
adb shell "rm -rf $DEVICE_TEST_DIR"

# cleanup build/
cd ..
# rm -rf build

exit $FAILED
