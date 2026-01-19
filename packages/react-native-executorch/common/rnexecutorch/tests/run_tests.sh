#!/bin/bash
set -e

DEVICE_TEST_DIR="/data/local/tmp/rnexecutorch_tests"

# cleanup build artifacts
rm -rf build
mkdir build
cd build

# cross-compile tests with Android toolchain
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-34 \
  -DANDROID_STL=c++_static

make

adb shell "mkdir -p $DEVICE_TEST_DIR"

# TEST_EXECUTABLES=("NumericalTests" "LogTests", "BaseModelTests")
TEST_EXECUTABLES=("BaseModelTests")

# push test executables to device
echo "Pushing test executables to device..."
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if [ -f "$test_exe" ]; then
    adb push "$test_exe" "$DEVICE_TEST_DIR/"
    adb shell "chmod +x $DEVICE_TEST_DIR/$test_exe"
  fi
done

# run tests on device
echo "Running tests on device..."
FAILED=0
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if adb shell "[ -f $DEVICE_TEST_DIR/$test_exe ]"; then
    echo "=== Running $test_exe ==="
    if ! adb shell "cd $DEVICE_TEST_DIR && ./$test_exe --gtest_color=yes"; then
      FAILED=1
    fi
  fi
done

# cleanup device
adb shell "rm -rf $DEVICE_TEST_DIR"

# cleanup build/
cd ..
rm -rf build

exit $FAILED
