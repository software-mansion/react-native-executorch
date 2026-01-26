#!/bin/bash
set -e

# ============================================================================
# Constants
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$SCRIPT_DIR/../../.."
ANDROID_ABI="arm64-v8a"
ANDROID_LIBS_DIR="$PACKAGE_ROOT/third-party/android/libs"
DEVICE_TEST_DIR="/data/local/tmp/rnexecutorch_tests"
MODELS_DIR="$SCRIPT_DIR/integration/assets/models"

# ============================================================================
# Test executables
# ============================================================================
TEST_EXECUTABLES=(
  "NumericalTests"
  "LogTests"
  "BaseModelTests"
  "ClassificationTests"
  "ObjectDetectionTests"
  "ImageEmbeddingsTests"
  "TextEmbeddingsTests"
  "StyleTransferTests"
  "VADTests"
  "TokenizerModuleTests"
  "SpeechToTextTests"
  "LLMTests"
  "ImageSegmentationTests"
  "TextToImageTests"
  "OCRTests"
  "VerticalOCRTests"
)

# ============================================================================
# Test assets
# ============================================================================
TEST_ASSETS=(
  "integration/assets/test_audio_float.raw"
  "integration/assets/we_are_software_mansion.jpg"
  "integration/assets/test_ocr_image.png"
)

# ============================================================================
# Models to download (format: "filename|url")
# ============================================================================
MODELS=(
  "style_transfer_candy_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/main/xnnpack/style_transfer_candy_xnnpack.pte"
  "efficientnet_v2_s_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.6.0/xnnpack/efficientnet_v2_s_xnnpack.pte"
  "ssdlite320-mobilenetv3-large.pte|https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.6.0/ssdlite320-mobilenetv3-large.pte"
  "test_image.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg"
  "clip-vit-base-patch32-vision_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.6.0/clip-vit-base-patch32-vision_xnnpack.pte"
  "all-MiniLM-L6-v2_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.6.0/all-MiniLM-L6-v2_xnnpack.pte"
  "tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.6.0/tokenizer.json"
  "fsmn-vad_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad/resolve/main/xnnpack/fsmn-vad_xnnpack.pte"
  "whisper_tiny_en_encoder_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/main/xnnpack/whisper_tiny_en_encoder_xnnpack.pte"
  "whisper_tiny_en_decoder_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/main/xnnpack/whisper_tiny_en_decoder_xnnpack.pte"
  "whisper_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.6.0/tokenizer.json"
  "smolLm2_135M_8da4w.pte|https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.6.0/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte"
  "smollm_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.6.0/tokenizer.json"
  "deeplabV3_xnnpack_fp32.pte|https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.6.0/xnnpack/deeplabV3_xnnpack_fp32.pte"
  "xnnpack_crnn_english.pte|https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/resolve/v0.7.0/xnnpack/english/xnnpack_crnn_english.pte"
  "xnnpack_craft_quantized.pte|https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.7.0/xnnpack/xnnpack_craft.pte"
  "t2i_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/tokenizer/tokenizer.json"
  "t2i_encoder.pte|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/text_encoder/model.pte"
  "t2i_unet.pte|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/unet/model.256.pte"
  "t2i_decoder.pte|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/v0.6.0/vae/model.256.pte"
)

# ============================================================================
# Libraries to push
# ============================================================================
REQUIRED_LIBS=(
  "$ANDROID_LIBS_DIR/executorch/$ANDROID_ABI/libexecutorch.so:libexecutorch_jni.so"
  "$ANDROID_LIBS_DIR/pthreadpool/$ANDROID_ABI/libpthreadpool.so:libpthreadpool.so"
  "$ANDROID_LIBS_DIR/cpuinfo/$ANDROID_ABI/libcpuinfo.so:libcpuinfo.so"
)

GRADLE_LIBS_DIR="$PACKAGE_ROOT/android/build/intermediates/cmake/release/obj/$ANDROID_ABI"
GRADLE_LIBS=(
  "libfbjni.so"
  "libc++_shared.so"
)

# ============================================================================
# Flags
# ============================================================================
REFRESH_MODELS=false
SKIP_BUILD=false

# ============================================================================
# Functions
# ============================================================================

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --refresh-models   Force re-download of all models
  --skip-build       Skip the CMake build step
  --help             Show this help message

EOF
}

log() {
  echo "[$(date +'%H:%M:%S')] $*"
}

error() {
  echo "[ERROR] $*" >&2
}

download_if_needed() {
  local url="$1"
  local output="$2"
  local filepath="$MODELS_DIR/$output"

  if [ "$REFRESH_MODELS" = true ] || [ ! -f "$filepath" ]; then
    log "Downloading $output..."
    wget -q -O "$filepath" "$url"
  else
    log "$output already exists, skipping"
  fi
}

push_file() {
  local src="$1"
  local dest="$2"

  if [ -f "$src" ]; then
    adb push "$src" "$dest" >/dev/null
  else
    error "File not found: $src"
  fi
}

run_test() {
  local test_exe="$1"

  if adb shell "[ -f $DEVICE_TEST_DIR/$test_exe ]"; then
    log "Running $test_exe"
    if ! adb shell "cd $DEVICE_TEST_DIR && LD_LIBRARY_PATH=. ./$test_exe --gtest_color=yes"; then
      return 1
    fi
  fi
  return 0
}

# ============================================================================
# Parse arguments
# ============================================================================
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
  --help)
    print_usage
    exit 0
    ;;
  *)
    error "Unknown option: $arg"
    print_usage
    exit 1
    ;;
  esac
done

# ============================================================================
# Validate environment
# ============================================================================
if ! adb shell ":"; then
  error "ADB shell couldn't run successfully"
  exit 1
fi

if [ -z "$ANDROID_NDK" ]; then
  error "ANDROID_NDK is not set"
  exit 1
fi

log "ANDROID_NDK = $ANDROID_NDK"

# ============================================================================
# Build tests
# ============================================================================
if [ "$SKIP_BUILD" = false ]; then
  log "Building tests..."
  rm -rf build
  mkdir build
  cd build

  cmake .. \
    -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
    -DANDROID_ABI=$ANDROID_ABI \
    -DANDROID_PLATFORM=android-34 \
    -DANDROID_STL=c++_shared

  make
else
  if ! [ -d build ]; then
    error "Build was skipped and the build directory doesn't exist"
    exit 1
  fi
  log "Skipping build..."
  cd build
fi

# ============================================================================
# Prepare device
# ============================================================================
log "Creating device test directory..."
adb shell "mkdir -p $DEVICE_TEST_DIR"

# ============================================================================
# Push test executables
# ============================================================================
log "Pushing test executables to device..."
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if [ -f "$test_exe" ]; then
    push_file "$test_exe" "$DEVICE_TEST_DIR/"
    adb shell "chmod +x $DEVICE_TEST_DIR/$test_exe"
  fi
done

# ============================================================================
# Push test assets
# ============================================================================
log "Pushing test assets to device..."
for asset in "${TEST_ASSETS[@]}"; do
  push_file "../$asset" "$DEVICE_TEST_DIR/"
done

# ============================================================================
# Download models
# ============================================================================
log "Downloading models (use --refresh-models to force re-download)..."
mkdir -p "$MODELS_DIR"

for entry in "${MODELS[@]}"; do
  IFS='|' read -r filename url <<<"$entry"
  download_if_needed "$url" "$filename"
done

# ============================================================================
# Push models
# ============================================================================
log "Pushing models to device..."
for model in "$MODELS_DIR"/*; do
  if [ -f "$model" ]; then
    push_file "$model" "$DEVICE_TEST_DIR/"
  fi
done

# ============================================================================
# Push libraries
# ============================================================================
log "Pushing shared libraries to device..."

for lib_entry in "${REQUIRED_LIBS[@]}"; do
  IFS=':' read -r src dest <<<"$lib_entry"
  if [ -f "$src" ]; then
    push_file "$src" "$DEVICE_TEST_DIR/$dest"
  fi
done

for lib in "${GRADLE_LIBS[@]}"; do
  if [ -f "$GRADLE_LIBS_DIR/$lib" ]; then
    push_file "$GRADLE_LIBS_DIR/$lib" "$DEVICE_TEST_DIR/"
  fi
done

# ============================================================================
# Run tests
# ============================================================================
log "Running tests on device..."
FAILED=0
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  if ! run_test "$test_exe"; then
    FAILED=1
  fi
done

# ============================================================================
# Cleanup
# ============================================================================
log "Cleaning up device..."
adb shell "rm -rf $DEVICE_TEST_DIR"

cd ..

if [ $FAILED -eq 0 ]; then
  log "All tests passed!"
else
  error "Some tests failed"
fi

exit $FAILED
