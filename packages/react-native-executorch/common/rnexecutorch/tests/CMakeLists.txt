if(NOT ANDROID_ABI)
    message(FATAL_ERROR "Tests can be only built for Android simulator")
endif()

cmake_minimum_required(VERSION 3.13)
project(RNExecutorchTests)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

# tests/                         <- CMAKE_SOURCE_DIR (this file's location)
# rnexecutorch/                  <- RNEXECUTORCH_DIR (parent of tests)
# common/                        <- COMMON_DIR
# react-native-executorch/       <- PACKAGE_ROOT
# <monorepo-root>/               <- MONOREPO_ROOT
# <monorepo-root>/third-party/   <- THIRD_PARTY_DIR
set(RNEXECUTORCH_DIR "${CMAKE_SOURCE_DIR}/..")
set(COMMON_DIR "${RNEXECUTORCH_DIR}/..")
set(PACKAGE_ROOT "${COMMON_DIR}/..")
set(MONOREPO_ROOT "${PACKAGE_ROOT}/../..")
set(THIRD_PARTY_DIR "${MONOREPO_ROOT}/third-party")
set(REACT_NATIVE_DIR "${MONOREPO_ROOT}/node_modules/react-native")
set(ANDROID_THIRD_PARTY "${PACKAGE_ROOT}/third-party/android/libs/")

# Add Gtest as a subdirectory
add_subdirectory(${THIRD_PARTY_DIR}/googletest ${PROJECT_BINARY_DIR}/googletest)

# ExecuTorch Prebuilt binaries
add_library(executorch_prebuilt SHARED IMPORTED)
set_target_properties(executorch_prebuilt PROPERTIES
    IMPORTED_LOCATION "${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so"
)

# pthreadpool and cpuinfo (needed for OpenMP/OpenCV)
if(ANDROID_ABI STREQUAL "arm64-v8a")
  add_library(pthreadpool SHARED IMPORTED)
  set_target_properties(pthreadpool PROPERTIES
      IMPORTED_LOCATION "${ANDROID_THIRD_PARTY}/pthreadpool/${ANDROID_ABI}/libpthreadpool.so"
  )

  add_library(cpuinfo SHARED IMPORTED)
  set_target_properties(cpuinfo PROPERTIES
      IMPORTED_LOCATION "${ANDROID_THIRD_PARTY}/cpuinfo/${ANDROID_ABI}/libcpuinfo.so"
  )

  set(EXECUTORCH_LIBS pthreadpool cpuinfo)
else()
  set(EXECUTORCH_LIBS "")
endif()

# OpenCV (Interface Library)
set(OPENCV_LIBS_DIR "${ANDROID_THIRD_PARTY}/opencv/${ANDROID_ABI}")
set(OPENCV_THIRD_PARTY_DIR "${ANDROID_THIRD_PARTY}/opencv-third-party/${ANDROID_ABI}")

if(ANDROID_ABI STREQUAL "arm64-v8a")
  set(OPENCV_THIRD_PARTY_LIBS
    "${OPENCV_THIRD_PARTY_DIR}/libkleidicv_hal.a"
    "${OPENCV_THIRD_PARTY_DIR}/libkleidicv_thread.a"
    "${OPENCV_THIRD_PARTY_DIR}/libkleidicv.a"
  )
elseif(ANDROID_ABI STREQUAL "x86_64")
  set(OPENCV_THIRD_PARTY_LIBS "")
endif()


add_library(opencv_deps INTERFACE)
target_link_libraries(opencv_deps INTERFACE
    ${OPENCV_LIBS_DIR}/libopencv_core.a
    ${OPENCV_LIBS_DIR}/libopencv_features2d.a
    ${OPENCV_LIBS_DIR}/libopencv_highgui.a
    ${OPENCV_LIBS_DIR}/libopencv_imgproc.a
    ${OPENCV_LIBS_DIR}/libopencv_photo.a
    ${OPENCV_LIBS_DIR}/libopencv_video.a
    ${OPENCV_THIRD_PARTY_LIBS}
    ${EXECUTORCH_LIBS}
    z
    dl
    m
    log
)
target_link_options(opencv_deps INTERFACE -fopenmp -static-openmp)

# Tokenizers (Interface Library)
set(TOKENIZERS_LIBS_DIR "${ANDROID_THIRD_PARTY}/tokenizers-cpp/${ANDROID_ABI}")
add_library(tokenizers_deps INTERFACE)
target_link_libraries(tokenizers_deps INTERFACE
    ${TOKENIZERS_LIBS_DIR}/libtokenizers_cpp.a
    ${TOKENIZERS_LIBS_DIR}/libtokenizers_c.a
    ${TOKENIZERS_LIBS_DIR}/libsentencepiece.a
)

# Source Definitions
set(CORE_SOURCES
    ${RNEXECUTORCH_DIR}/models/BaseModel.cpp
    ${RNEXECUTORCH_DIR}/data_processing/Numerical.cpp
    ${CMAKE_SOURCE_DIR}/integration/stubs/jsi_stubs.cpp
)

set(IMAGE_UTILS_SOURCES
    ${RNEXECUTORCH_DIR}/data_processing/ImageProcessing.cpp
    ${RNEXECUTORCH_DIR}/data_processing/base64.cpp
    ${COMMON_DIR}/ada/ada.cpp
)

set(TOKENIZER_SOURCES ${RNEXECUTORCH_DIR}/TokenizerModule.cpp)
set(DSP_SOURCES ${RNEXECUTORCH_DIR}/data_processing/dsp.cpp)

# Core Library
add_library(rntests_core STATIC ${CORE_SOURCES})

target_include_directories(rntests_core PUBLIC
    ${RNEXECUTORCH_DIR}/data_processing
    ${RNEXECUTORCH_DIR}
    ${COMMON_DIR}
    ${PACKAGE_ROOT}/third-party/include
    ${REACT_NATIVE_DIR}/ReactCommon
    ${REACT_NATIVE_DIR}/ReactCommon/jsi
    ${REACT_NATIVE_DIR}/ReactCommon/callinvoker
    ${COMMON_DIR}/ada
)

target_link_libraries(rntests_core PUBLIC
    executorch_prebuilt
    gtest
    log
)

enable_testing()
function(add_rn_test TEST_TARGET TEST_FILENAME)
    cmake_parse_arguments(ARG "" "" "SOURCES;LIBS" ${ARGN})
    # Create executable using the explicit filename provided
    add_executable(${TEST_TARGET} ${TEST_FILENAME} ${ARG_SOURCES})

    target_link_libraries(${TEST_TARGET} PRIVATE rntests_core gtest_main ${ARG_LIBS})
    target_link_options(${TEST_TARGET} PRIVATE "LINKER:-z,max-page-size=16384")

    add_test(NAME ${TEST_TARGET} COMMAND ${TEST_TARGET})
endfunction()

add_rn_test(NumericalTests unit/NumericalTest.cpp)
add_rn_test(LogTests unit/LogTest.cpp)
add_rn_test(BaseModelTests integration/BaseModelTest.cpp)

add_rn_test(ClassificationTests integration/ClassificationTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/classification/Classification.cpp
        ${IMAGE_UTILS_SOURCES}
    LIBS opencv_deps
)

add_rn_test(ObjectDetectionTests integration/ObjectDetectionTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/object_detection/ObjectDetection.cpp
        ${RNEXECUTORCH_DIR}/models/object_detection/Utils.cpp
        ${IMAGE_UTILS_SOURCES}
    LIBS opencv_deps
)

add_rn_test(ImageEmbeddingsTests integration/ImageEmbeddingsTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/embeddings/image/ImageEmbeddings.cpp
        ${RNEXECUTORCH_DIR}/models/embeddings/BaseEmbeddings.cpp
        ${IMAGE_UTILS_SOURCES}
    LIBS opencv_deps
)

add_rn_test(TextEmbeddingsTests integration/TextEmbeddingsTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/embeddings/text/TextEmbeddings.cpp
        ${RNEXECUTORCH_DIR}/models/embeddings/BaseEmbeddings.cpp
        ${TOKENIZER_SOURCES}
    LIBS tokenizers_deps
)

add_rn_test(StyleTransferTests integration/StyleTransferTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/style_transfer/StyleTransfer.cpp
        ${IMAGE_UTILS_SOURCES}
    LIBS opencv_deps
)

add_rn_test(VADTests integration/VoiceActivityDetectionTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/voice_activity_detection/VoiceActivityDetection.cpp
        ${RNEXECUTORCH_DIR}/models/voice_activity_detection/Utils.cpp
        ${DSP_SOURCES}
)

add_rn_test(TokenizerModuleTests integration/TokenizerModuleTest.cpp
    SOURCES ${TOKENIZER_SOURCES}
    LIBS tokenizers_deps
)

add_rn_test(SpeechToTextTests integration/SpeechToTextTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/speech_to_text/SpeechToText.cpp
        ${RNEXECUTORCH_DIR}/models/speech_to_text/asr/ASR.cpp
        ${RNEXECUTORCH_DIR}/models/speech_to_text/stream/HypothesisBuffer.cpp
        ${RNEXECUTORCH_DIR}/models/speech_to_text/stream/OnlineASRProcessor.cpp
        ${RNEXECUTORCH_DIR}/data_processing/gzip.cpp
        ${TOKENIZER_SOURCES}
        ${DSP_SOURCES}
    LIBS tokenizers_deps z
)

add_rn_test(LLMTests integration/LLMTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/llm/LLM.cpp
        ${COMMON_DIR}/runner/runner.cpp
        ${COMMON_DIR}/runner/text_prefiller.cpp
        ${COMMON_DIR}/runner/text_decoder_runner.cpp
        ${COMMON_DIR}/runner/sampler.cpp
        ${COMMON_DIR}/runner/arange_util.cpp
    LIBS tokenizers_deps
)

add_rn_test(TextToImageTests integration/TextToImageTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/text_to_image/TextToImage.cpp
        ${RNEXECUTORCH_DIR}/models/text_to_image/Encoder.cpp
        ${RNEXECUTORCH_DIR}/models/text_to_image/UNet.cpp
        ${RNEXECUTORCH_DIR}/models/text_to_image/Decoder.cpp
        ${RNEXECUTORCH_DIR}/models/text_to_image/Scheduler.cpp
        ${RNEXECUTORCH_DIR}/models/embeddings/text/TextEmbeddings.cpp
        ${RNEXECUTORCH_DIR}/models/embeddings/BaseEmbeddings.cpp
        ${TOKENIZER_SOURCES}
    LIBS tokenizers_deps
)

add_rn_test(OCRTests integration/OCRTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/models/ocr/OCR.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/CTCLabelConverter.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/Detector.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/RecognitionHandler.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/Recognizer.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/utils/DetectorUtils.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/utils/RecognitionHandlerUtils.cpp
        ${RNEXECUTORCH_DIR}/models/ocr/utils/RecognizerUtils.cpp
        ${IMAGE_UTILS_SOURCES}
    LIBS opencv_deps
)
