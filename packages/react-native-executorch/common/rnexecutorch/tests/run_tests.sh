#!/bin/bash
set -e

# Parse arguments
REFRESH_MODELS=false
SKIP_BUILD=false

for arg in "$@"; do
  case $arg in
  --refresh-models)
    REFRESH_MODELS=true
    shift
    ;;
  --skip-build)
    SKIP_BUILD=true
    shift
    ;;
  esac
done

if ! adb shell ":"; then
  echo "ERROR: ADB SHELL COULDN'T RUN SUCCESFULLY"
  exit 1
fi

echo "ANDROID_NDK = $ANDROID_NDK"
if [ -z "$ANDROID_NDK" ]; then
  echo "ERROR: ANDROID_NDK IS NOT SET"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$SCRIPT_DIR/../../.."
ANDROID_ABI="arm64-v8a"
ANDROID_LIBS_DIR="$PACKAGE_ROOT/third-party/android/libs"

DEVICE_TEST_DIR="/data/local/tmp/rnexecutorch_tests"
MODELS_DIR="$SCRIPT_DIR/integration/assets/models"

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# Helper function to download a file if it doesn't exist (or if --refresh-models is used)
download_if_needed() {
  local url="$1"
  local output="$2"
  local filepath="$MODELS_DIR/$output"

  if [ "$REFRESH_MODELS" = true ] || [ ! -f "$filepath" ]; then
    echo "  Downloading $output..."
    wget -q -O "$filepath" "$url"
  else
    echo "  $output already exists, skipping download"
  fi
}

if [ "$SKIP_BUILD" = false ]; then
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
else
  if ! [ -d build ]; then
    echo "Build was skipped and the build directory doesn't exist. Exiting."
    exit 1
  fi
  echo "Skipping build..."
  cd build
fi

adb shell "mkdir -p $DEVICE_TEST_DIR"

TEST_EXECUTABLES=("NumericalTests" "LogTests" "BaseModelTests" "ClassificationTests" "ObjectDetectionTests" "ImageEmbeddingsTests" "TextEmbeddingsTests" "StyleTransferTests" "VADTests" "TokenizerModuleTests" "SpeechToTextTests" "LLMTests" "ImageSegmentationTests" "TextToImageTests" "OCRTests")

# push test executables to device
echo "Pushing test executables to device..."
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if [ -f "$test_exe" ]; then
    adb push "$test_exe" "$DEVICE_TEST_DIR/" >/dev/null
    adb shell "chmod +x $DEVICE_TEST_DIR/$test_exe"
  fi
done

# Push test assets to device
adb push ../integration/assets/test_audio_float.raw $DEVICE_TEST_DIR >/dev/null
adb push ../integration/assets/we_are_software_mansion.jpg $DEVICE_TEST_DIR >/dev/null
adb push ../integration/assets/test_ocr_image.png $DEVICE_TEST_DIR >/dev/null

# download models needed for the tests
echo "Downloading models (use --refresh-models to force re-download)..."
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/main/xnnpack/style_transfer_candy_xnnpack.pte" "style_transfer_candy_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.6.0/xnnpack/efficientnet_v2_s_xnnpack.pte" "efficientnet_v2_s_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.6.0/ssdlite320-mobilenetv3-large.pte" "ssdlite320-mobilenetv3-large.pte"
download_if_needed "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg" "test_image.jpg"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.6.0/clip-vit-base-patch32-vision_xnnpack.pte" "clip-vit-base-patch32-vision_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.6.0/all-MiniLM-L6-v2_xnnpack.pte" "all-MiniLM-L6-v2_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.6.0/tokenizer.json" "tokenizer.json"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad/resolve/main/xnnpack/fsmn-vad_xnnpack.pte" "fsmn-vad_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/main/xnnpack/whisper_tiny_en_encoder_xnnpack.pte" "whisper_tiny_en_encoder_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/main/xnnpack/whisper_tiny_en_decoder_xnnpack.pte" "whisper_tiny_en_decoder_xnnpack.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.6.0/tokenizer.json" "whisper_tokenizer.json"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.6.0/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte" "smolLm2_135M_8da4w.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.6.0/tokenizer.json" "smollm_tokenizer.json"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.6.0/xnnpack/deeplabV3_xnnpack_fp32.pte" "deeplabV3_xnnpack_fp32.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/resolve/v0.7.0/xnnpack/english/xnnpack_crnn_english.pte" "xnnpack_crnn_english.pte"
# download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.7.0/xnnpack_quantized/xnnpack_craft_quantized.pte" "xnnpack_craft_quantized.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.7.0/xnnpack/xnnpack_craft.pte" "xnnpack_craft_quantized.pte"
#https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.7.0/xnnpack/xnnpack_craft.pte

# TextToImage models (large ~2GB total)
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/tokenizer/tokenizer.json" "t2i_tokenizer.json"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/text_encoder/model.pte" "t2i_encoder.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/unet/model.256.pte" "t2i_unet.pte"
download_if_needed "https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/vae/model.256.pte" "t2i_decoder.pte"

# Push models to device
echo "Pushing models to device..."
for model in "$MODELS_DIR"/*; do
  if [ -f "$model" ]; then
    adb push "$model" "$DEVICE_TEST_DIR/" >/dev/null
  fi
done

# push shared libraries needed by BaseModelTests
echo "Pushing shared libraries to device..."
GRADLE_LIBS="$PACKAGE_ROOT/android/build/intermediates/cmake/release/obj/$ANDROID_ABI"

adb push "$ANDROID_LIBS_DIR/executorch/$ANDROID_ABI/libexecutorch.so" "$DEVICE_TEST_DIR/libexecutorch_jni.so" >/dev/null

# Push pthreadpool and cpuinfo from ANDROID_LIBS_DIR (needed for OpenCV/OpenMP)
if [ -f "$ANDROID_LIBS_DIR/pthreadpool/$ANDROID_ABI/libpthreadpool.so" ]; then
  adb push "$ANDROID_LIBS_DIR/pthreadpool/$ANDROID_ABI/libpthreadpool.so" "$DEVICE_TEST_DIR/" >/dev/null
fi

if [ -f "$ANDROID_LIBS_DIR/cpuinfo/$ANDROID_ABI/libcpuinfo.so" ]; then
  adb push "$ANDROID_LIBS_DIR/cpuinfo/$ANDROID_ABI/libcpuinfo.so" "$DEVICE_TEST_DIR/" >/dev/null
fi

# Push other libs from GRADLE_LIBS
for lib in libfbjni.so libc++_shared.so; do
  if [ -f "$GRADLE_LIBS/$lib" ]; then
    adb push "$GRADLE_LIBS/$lib" "$DEVICE_TEST_DIR/" >/dev/null
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
