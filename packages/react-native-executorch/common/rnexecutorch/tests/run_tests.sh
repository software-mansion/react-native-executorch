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

# Keep in sync with `LIB_VERSION` in src/constants/versions.ts so the runner
# pulls the same artifacts that the JS API ships at runtime.
LIB_VERSION="0.9.0"
HF_VERSION_TAG="resolve/v${LIB_VERSION}"

# ============================================================================
# Test executables
# ============================================================================
TEST_EXECUTABLES=(
  "NumericalTests"
  "RunnerTests"
  "LogTests"
  "FileUtilsTest"
  "ImageProcessingTest"
  "FrameTransformTests"
  "BaseModelTests"
  "ClassificationTests"
  "ObjectDetectionTests"
  "ImageEmbeddingsTests"
  "TextEmbeddingsTests"
  "StyleTransferTests"
  "VADTests"
  "TokenizerModuleTests"
  "SpeechToTextTests"
  "TextToSpeechTests"
  "LLMTests"
  "TextToImageTests"
  "InstanceSegmentationTests"
  "PoseEstimationTests"
  "SemanticSegmentationTests"
  "OCRTests"
  "VerticalOCRTests"
)

# ============================================================================
# Test assets
# ============================================================================
TEST_ASSETS=(
  "integration/assets/test_audio_float.raw"
  "integration/assets/test_speech.raw"
  "integration/assets/we_are_software_mansion.jpg"
)

# ============================================================================
# Models to download (format: "filename|url")
# ============================================================================
MODELS=(
  "style_transfer_candy_xnnpack_fp32.pte|https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/${HF_VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_fp32.pte"
  "efficientnet_v2_s_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/${HF_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_fp32.pte"
  "ssdlite320-mobilenetv3-large.pte|https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/${HF_VERSION_TAG}/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte"
  "test_image.jpg|https://upload.wikimedia.org/wikipedia/commons/f/f8/Cat_in_tree03.jpg"
  "clip-vit-base-patch32-vision_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/${HF_VERSION_TAG}/xnnpack/clip_vit_base_patch32_image_xnnpack_fp32.pte"
  "all-MiniLM-L6-v2_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/${HF_VERSION_TAG}/xnnpack/all_minilm_l6_v2_xnnpack_fp32.pte"
  "tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/${HF_VERSION_TAG}/tokenizer.json"
  "fsmn-vad_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad/${HF_VERSION_TAG}/xnnpack/fsmn_vad_xnnpack_fp32.pte"
  "whisper_tiny_en_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/${HF_VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_fp32.pte"
  "whisper_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/${HF_VERSION_TAG}/tokenizer.json"
  "kokoro_duration_predictor.pte|https://huggingface.co/software-mansion/react-native-executorch-kokoro/${HF_VERSION_TAG}/xnnpack/standard/duration_predictor_std.pte"
  "kokoro_synthesizer.pte|https://huggingface.co/software-mansion/react-native-executorch-kokoro/${HF_VERSION_TAG}/xnnpack/standard/synthesizer_std.pte"
  "kokoro_af_heart.bin|https://huggingface.co/software-mansion/react-native-executorch-kokoro/${HF_VERSION_TAG}/voices/af_heart.bin"
  "kokoro_us_lexicon.json|https://huggingface.co/software-mansion/react-native-executorch-kokoro/${HF_VERSION_TAG}/phonemizer/en-us/lexicon.json"
  "kokoro_en_tagger.json|https://huggingface.co/software-mansion/react-native-executorch-kokoro/${HF_VERSION_TAG}/phonemizer/en-us/tags.json"
  "kokoro_us_phonemizer.pte|https://huggingface.co/software-mansion/react-native-executorch-kokoro/${HF_VERSION_TAG}/phonemizer/en-us/phonemizer_en_us.pte"
  "smolLm2_135M_8da4w.pte|https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/${HF_VERSION_TAG}/135m/xnnpack/smollm2_135m_xnnpack_8da4w.pte"
  "smollm_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/${HF_VERSION_TAG}/tokenizer.json"
  "deeplabV3_xnnpack_fp32.pte|https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/${HF_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_fp32.pte"
  "xnnpack_crnn_english.pte|https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/${HF_VERSION_TAG}/english/xnnpack/crnn_english_xnnpack_fp32.pte"
  "xnnpack_craft_quantized.pte|https://huggingface.co/software-mansion/react-native-executorch-detector-craft/${HF_VERSION_TAG}/xnnpack/craft_xnnpack_int8.pte"
  "t2i_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/${HF_VERSION_TAG}/tokenizer/tokenizer.json"
  "t2i_encoder.pte|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/${HF_VERSION_TAG}/xnnpack/bk_sdm_tiny_text_encoder_xnnpack_fp32.pte"
  "t2i_unet.pte|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/${HF_VERSION_TAG}/xnnpack/bk_sdm_tiny_unet_256_xnnpack_fp32.pte"
  "t2i_decoder.pte|https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/${HF_VERSION_TAG}/xnnpack/bk_sdm_tiny_vae_256_xnnpack_fp32.pte"
  "lfm2_5_vl_quantized_xnnpack_v2.pte|https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/${HF_VERSION_TAG}/vl_1_6b/xnnpack/lfm_2_5_vl_1_6b_xnnpack_8da4w.pte"
  "lfm2_vl_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/${HF_VERSION_TAG}/vl_1_6b/tokenizer.json"
  "lfm2_vl_tokenizer_config.json|https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5/${HF_VERSION_TAG}/vl_1_6b/tokenizer_config.json"
  "gemma4_e2b_mm_xnnpack.pte|https://huggingface.co/software-mansion/react-native-executorch-gemma-4-multimodal/${HF_VERSION_TAG}/e2b/xnnpack/gemma_4_e2b_xnnpack_8da4w.pte"
  "gemma_tokenizer.json|https://huggingface.co/software-mansion/react-native-executorch-gemma-4/${HF_VERSION_TAG}/e2b/tokenizer.json"
  "yolo26n-seg.pte|https://huggingface.co/software-mansion/react-native-executorch-yolo26-seg/${HF_VERSION_TAG}/n/xnnpack/yolo26_seg_n_xnnpack_fp32.pte"
  "segmentation_image.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Collage_audi.jpg/1280px-Collage_audi.jpg"
  "yolo26n-pose.pte|https://huggingface.co/software-mansion/react-native-executorch-yolo26-pose/${HF_VERSION_TAG}/xnnpack/yolo26_pose_n_xnnpack_fp32.pte"
)

# ============================================================================
# Libraries to push
# ============================================================================
REQUIRED_LIBS=(
  "$ANDROID_LIBS_DIR/executorch/$ANDROID_ABI/libexecutorch.so:libexecutorch_jni.so"
  "$ANDROID_LIBS_DIR/pthreadpool/$ANDROID_ABI/libpthreadpool.so:libpthreadpool.so"
  "$ANDROID_LIBS_DIR/cpuinfo/$ANDROID_ABI/libcpuinfo.so:libcpuinfo.so"
)

# Dynamically find libfbjni.so from CMake builds (exclude node_modules for speed)
# Get libc++_shared.so directly from NDK
MONOREPO_ROOT="$PACKAGE_ROOT/../../.."

LIBFBJNI_PATH="$SCRIPT_DIR/integration/libs/libfbjni.so"

if [ -z "$LIBFBJNI_PATH" ]; then
  echo "Error: libfbjni.so not found."
  echo "Please build an app first: cd apps/computer-vision/android && ./gradlew assembleRelease"
  exit 1
fi

# Get libc++_shared.so from NDK based on host platform
if [[ "$OSTYPE" == "darwin"* ]]; then
  NDK_HOST="darwin-x86_64"
else
  NDK_HOST="linux-x86_64"
fi

LIBCPP_PATH="$ANDROID_NDK/toolchains/llvm/prebuilt/$NDK_HOST/sysroot/usr/lib/aarch64-linux-android/libc++_shared.so"

if [ ! -f "$LIBCPP_PATH" ]; then
  echo "Error: libc++_shared.so not found at: $LIBCPP_PATH"
  exit 1
fi

GRADLE_LIBS=(
  "$LIBFBJNI_PATH:libfbjni.so"
  "$LIBCPP_PATH:libc++_shared.so"
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

# Returns a space-separated list of model/asset filenames (in $MODELS_DIR) that
# the given test executable loads at runtime. Tests not listed here have no
# model dependencies. Adding a new test? Add its filenames below.
models_for_test() {
  case "$1" in
  BaseModelTests) echo "style_transfer_candy_xnnpack_fp32.pte" ;;
  ClassificationTests) echo "efficientnet_v2_s_xnnpack.pte test_image.jpg" ;;
  ObjectDetectionTests) echo "ssdlite320-mobilenetv3-large.pte test_image.jpg" ;;
  ImageEmbeddingsTests) echo "clip-vit-base-patch32-vision_xnnpack.pte test_image.jpg" ;;
  TextEmbeddingsTests) echo "all-MiniLM-L6-v2_xnnpack.pte tokenizer.json" ;;
  StyleTransferTests) echo "style_transfer_candy_xnnpack_fp32.pte test_image.jpg" ;;
  VADTests) echo "fsmn-vad_xnnpack.pte" ;;
  TokenizerModuleTests) echo "tokenizer.json" ;;
  SpeechToTextTests) echo "whisper_tiny_en_xnnpack.pte whisper_tokenizer.json fsmn-vad_xnnpack.pte" ;;
  TextToSpeechTests) echo "kokoro_duration_predictor.pte kokoro_synthesizer.pte kokoro_af_heart.bin kokoro_us_lexicon.json kokoro_en_tagger.json kokoro_us_phonemizer.pte" ;;
  LLMTests) echo "smolLm2_135M_8da4w.pte smollm_tokenizer.json lfm2_5_vl_quantized_xnnpack_v2.pte lfm2_vl_tokenizer.json lfm2_vl_tokenizer_config.json test_image.jpg gemma4_e2b_mm_xnnpack.pte gemma_tokenizer.json" ;;
  TextToImageTests) echo "t2i_tokenizer.json t2i_encoder.pte t2i_unet.pte t2i_decoder.pte" ;;
  InstanceSegmentationTests) echo "yolo26n-seg.pte segmentation_image.jpg" ;;
  PoseEstimationTests) echo "yolo26n-pose.pte" ;;
  SemanticSegmentationTests) echo "deeplabV3_xnnpack_fp32.pte test_image.jpg" ;;
  OCRTests | VerticalOCRTests) echo "xnnpack_craft_quantized.pte xnnpack_crnn_english.pte" ;;
  *) echo "" ;;
  esac
}

push_test_models() {
  local models="$1"
  for filename in $models; do
    push_file "$MODELS_DIR/$filename" "$DEVICE_TEST_DIR/"
  done
}

cleanup_test_models() {
  local models="$1"
  for filename in $models; do
    adb shell "rm -f $DEVICE_TEST_DIR/$filename" >/dev/null 2>&1 || true
  done
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

# Models are pushed per-test in the run loop below to keep peak device disk
# usage low (the full set is ~6GB, far more than `/data/local/tmp` on a typical
# emulator). See `models_for_test` for the test → models mapping.

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

for lib_entry in "${GRADLE_LIBS[@]}"; do
  IFS=':' read -r src dest <<<"$lib_entry"
  if [ -f "$src" ]; then
    push_file "$src" "$DEVICE_TEST_DIR/"
  else
    error "Library not found: $src"
  fi
done

# ============================================================================
# Run tests
# ============================================================================
log "Running tests on device..."
FAILED=0
for test_exe in "${TEST_EXECUTABLES[@]}"; do
  models=$(models_for_test "$test_exe")

  if [ -n "$models" ]; then
    log "Pushing models for $test_exe..."
    push_test_models "$models"
  fi

  if ! run_test "$test_exe"; then
    FAILED=1
  fi

  if [ -n "$models" ]; then
    cleanup_test_models "$models"
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
