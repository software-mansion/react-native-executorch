# Since this test suite needs access to prebuilt Android ExecuTorch / other 3p libs, we early return if the target is not Android
if(NOT ANDROID_ABI)
    message(FATAL_ERROR "This can be only built for Android simulator")
endif()

cmake_minimum_required(VERSION 3.13)
project(RNExecutorchTests)

# C++ standard
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

# GoogleTest
add_subdirectory(${THIRD_PARTY_DIR}/googletest ${PROJECT_BINARY_DIR}/googletest)

# Include directories
include_directories(${RNEXECUTORCH_DIR}/data_processing)
include_directories(${RNEXECUTORCH_DIR})
include_directories(${COMMON_DIR})
include_directories(${PACKAGE_ROOT}/third-party/include)

# React Native / JSI headers
include_directories(${REACT_NATIVE_DIR}/ReactCommon)
include_directories(${REACT_NATIVE_DIR}/ReactCommon/jsi)
include_directories(${REACT_NATIVE_DIR}/ReactCommon/callinvoker)

# Source files
set(NUMERICAL_SOURCES ${RNEXECUTORCH_DIR}/data_processing/Numerical.cpp)
set(BASEMODEL_SOURCES ${RNEXECUTORCH_DIR}/models/BaseModel.cpp)
set(CLASSIFICATION_SOURCES ${RNEXECUTORCH_DIR}/models/classification/Classification.cpp)
set(OBJECT_DETECTION_SOURCES
  ${RNEXECUTORCH_DIR}/models/object_detection/ObjectDetection.cpp
  ${RNEXECUTORCH_DIR}/models/object_detection/Utils.cpp
)
set(IMAGE_PROCESSING_SOURCES ${RNEXECUTORCH_DIR}/data_processing/ImageProcessing.cpp)
set(BASE64_SOURCES ${RNEXECUTORCH_DIR}/data_processing/base64.cpp)
set(ADA_SOURCES ${COMMON_DIR}/ada/ada.cpp)
set(BASE_EMBEDDINGS_SOURCES ${RNEXECUTORCH_DIR}/models/embeddings/BaseEmbeddings.cpp)
set(IMAGE_EMBEDDINGS_SOURCES ${RNEXECUTORCH_DIR}/models/embeddings/image/ImageEmbeddings.cpp)
set(TEXT_EMBEDDINGS_SOURCES ${RNEXECUTORCH_DIR}/models/embeddings/text/TextEmbeddings.cpp)
set(TOKENIZER_SOURCES ${RNEXECUTORCH_DIR}/TokenizerModule.cpp)
set(STYLE_TRANSFER_SOURCES ${RNEXECUTORCH_DIR}/models/style_transfer/StyleTransfer.cpp)
# set(IMAGE_SEGMENTATION_SOURCES
#   ${RNEXECUTORCH_DIR}/models/image_segmentation/ImageSegmentation.cpp
# )
set(VAD_SOURCES
  ${RNEXECUTORCH_DIR}/models/voice_activity_detection/VoiceActivityDetection.cpp
  ${RNEXECUTORCH_DIR}/models/voice_activity_detection/Utils.cpp
)
set(DSP_SOURCES ${RNEXECUTORCH_DIR}/data_processing/dsp.cpp)
set(GZIP_SOURCES ${RNEXECUTORCH_DIR}/data_processing/gzip.cpp)
set(S2T_SOURCES
  ${RNEXECUTORCH_DIR}/models/speech_to_text/SpeechToText.cpp
  ${RNEXECUTORCH_DIR}/models/speech_to_text/asr/ASR.cpp
  ${RNEXECUTORCH_DIR}/models/speech_to_text/stream/HypothesisBuffer.cpp
  ${RNEXECUTORCH_DIR}/models/speech_to_text/stream/OnlineASRProcessor.cpp
)
set(RUNNER_SOURCES
  ${COMMON_DIR}/runner/runner.cpp
  ${COMMON_DIR}/runner/text_prefiller.cpp
  ${COMMON_DIR}/runner/text_decoder_runner.cpp
  ${COMMON_DIR}/runner/sampler.cpp
  ${COMMON_DIR}/runner/arange_util.cpp
)
set(LLM_SOURCES
  ${RNEXECUTORCH_DIR}/models/llm/LLM.cpp
)
set(TEXT_TO_IMAGE_SOURCES
  ${RNEXECUTORCH_DIR}/models/text_to_image/TextToImage.cpp
  ${RNEXECUTORCH_DIR}/models/text_to_image/Encoder.cpp
  ${RNEXECUTORCH_DIR}/models/text_to_image/UNet.cpp
  ${RNEXECUTORCH_DIR}/models/text_to_image/Decoder.cpp
  ${RNEXECUTORCH_DIR}/models/text_to_image/Scheduler.cpp
)

# Stubs for mocking JSI/React Native symbols
set(JSI_STUBS ${CMAKE_SOURCE_DIR}/stubs/jsi_stubs.cpp)

# Ada URL parser include
include_directories(${COMMON_DIR}/ada)

# OpenCV (static libraries)
set(OPENCV_LIBS_DIR "${ANDROID_THIRD_PARTY}/opencv/${ANDROID_ABI}")
set(OPENCV_LIBS
  ${OPENCV_LIBS_DIR}/libopencv_imgproc.a
  ${OPENCV_LIBS_DIR}/libopencv_core.a
  ${OPENCV_LIBS_DIR}/libopencv_photo.a
  ${OPENCV_LIBS_DIR}/libopencv_video.a
  ${OPENCV_LIBS_DIR}/libopencv_features2d.a
  ${OPENCV_LIBS_DIR}/libopencv_highgui.a
)
set(OPENCV_THIRD_PARTY_DIR "${ANDROID_THIRD_PARTY}/opencv-third-party/${ANDROID_ABI}")
file(GLOB OPENCV_THIRD_PARTY_LIBS "${OPENCV_THIRD_PARTY_DIR}/*.a")

# Tokenizers-cpp (static libraries)
set(TOKENIZERS_LIBS_DIR "${ANDROID_THIRD_PARTY}/tokenizers-cpp/${ANDROID_ABI}")
set(TOKENIZERS_LIBS
  ${TOKENIZERS_LIBS_DIR}/libtokenizers_cpp.a
  ${TOKENIZERS_LIBS_DIR}/libtokenizers_c.a
  ${TOKENIZERS_LIBS_DIR}/libsentencepiece.a
)

# Executables for the tests
add_executable(NumericalTests NumericalTest.cpp ${NUMERICAL_SOURCES})
add_executable(LogTests LogTest.cpp)
add_executable(BaseModelTests BaseModelTest.cpp ${BASEMODEL_SOURCES} ${JSI_STUBS})
add_executable(ClassificationTests ClassificationTest.cpp
  ${CLASSIFICATION_SOURCES}
  ${BASEMODEL_SOURCES}
  ${IMAGE_PROCESSING_SOURCES}
  ${NUMERICAL_SOURCES}
  ${BASE64_SOURCES}
  ${ADA_SOURCES}
  ${JSI_STUBS}
)
add_executable(ObjectDetectionTests ObjectDetectionTest.cpp
  ${OBJECT_DETECTION_SOURCES}
  ${BASEMODEL_SOURCES}
  ${IMAGE_PROCESSING_SOURCES}
  ${NUMERICAL_SOURCES}
  ${BASE64_SOURCES}
  ${ADA_SOURCES}
  ${JSI_STUBS}
)
add_executable(ImageEmbeddingsTests ImageEmbeddingsTest.cpp
  ${IMAGE_EMBEDDINGS_SOURCES}
  ${BASE_EMBEDDINGS_SOURCES}
  ${BASEMODEL_SOURCES}
  ${IMAGE_PROCESSING_SOURCES}
  ${NUMERICAL_SOURCES}
  ${BASE64_SOURCES}
  ${ADA_SOURCES}
  ${JSI_STUBS}
)
add_executable(TextEmbeddingsTests TextEmbeddingsTest.cpp
  ${TEXT_EMBEDDINGS_SOURCES}
  ${BASE_EMBEDDINGS_SOURCES}
  ${BASEMODEL_SOURCES}
  ${TOKENIZER_SOURCES}
  ${NUMERICAL_SOURCES}
  ${JSI_STUBS}
)
add_executable(StyleTransferTests StyleTransferTest.cpp
  ${STYLE_TRANSFER_SOURCES}
  ${BASEMODEL_SOURCES}
  ${IMAGE_PROCESSING_SOURCES}
  ${NUMERICAL_SOURCES}
  ${BASE64_SOURCES}
  ${ADA_SOURCES}
  ${JSI_STUBS}
)

# add_executable(ImageSegmentationTests ImageSegmentationTest.cpp
#   ${IMAGE_SEGMENTATION_SOURCES}
#   ${BASEMODEL_SOURCES}
#   ${IMAGE_PROCESSING_SOURCES}
#   ${NUMERICAL_SOURCES}
#   ${BASE64_SOURCES}
#   ${ADA_SOURCES}
#   ${JSI_STUBS}
# )

add_executable(VADTests VoiceActivityDetectionTest.cpp
  ${VAD_SOURCES}
  ${BASEMODEL_SOURCES}
  ${DSP_SOURCES}
  ${JSI_STUBS}
)
add_executable(TokenizerModuleTests TokenizerModuleTest.cpp
  ${TOKENIZER_SOURCES}
  ${JSI_STUBS}
)
add_executable(SpeechToTextTests SpeechToTextTest.cpp
  ${S2T_SOURCES}
  ${BASEMODEL_SOURCES}
  ${TOKENIZER_SOURCES}
  ${NUMERICAL_SOURCES}
  ${GZIP_SOURCES}
  ${DSP_SOURCES}
  ${JSI_STUBS}
)
add_executable(LLMTests LLMTest.cpp
  ${LLM_SOURCES}
  ${RUNNER_SOURCES}
  ${BASEMODEL_SOURCES}
  ${JSI_STUBS}
)
add_executable(TextToImageTests TextToImageTest.cpp
  ${TEXT_TO_IMAGE_SOURCES}
  ${TEXT_EMBEDDINGS_SOURCES}
  ${BASE_EMBEDDINGS_SOURCES}
  ${BASEMODEL_SOURCES}
  ${TOKENIZER_SOURCES}
  ${NUMERICAL_SOURCES}
  ${JSI_STUBS}
)

# Libraries linking
target_link_libraries(NumericalTests gtest gtest_main)
target_link_libraries(LogTests gtest gtest_main log)
target_link_libraries(BaseModelTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  gtest
  gtest_main
  log
)
target_link_options(ClassificationTests PRIVATE -fopenmp -static-openmp)
target_link_libraries(ClassificationTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  z
  gtest
  gtest_main
  log
)
target_link_options(ObjectDetectionTests PRIVATE -fopenmp -static-openmp)
target_link_libraries(ObjectDetectionTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  z
  gtest
  gtest_main
  log
)
target_link_options(ImageEmbeddingsTests PRIVATE -fopenmp -static-openmp)
target_link_libraries(ImageEmbeddingsTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  z
  gtest
  gtest_main
  log
)
target_link_libraries(TextEmbeddingsTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${TOKENIZERS_LIBS}
  gtest
  gtest_main
  log
)
target_link_options(StyleTransferTests PRIVATE -fopenmp -static-openmp)
target_link_libraries(StyleTransferTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  z
  gtest
  gtest_main
  log
)

# target_link_options(ImageSegmentationTests PRIVATE -fopenmp -static-openmp)
# target_link_libraries(ImageSegmentationTests
#   PRIVATE
#   ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
#   ${OPENCV_LIBS}
#   ${OPENCV_THIRD_PARTY_LIBS}
#   z
#   gtest
#   gtest_main
#   log
# )

target_link_libraries(VADTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  gtest
  gtest_main
  log
)
target_link_libraries(TokenizerModuleTests
  PRIVATE
  ${TOKENIZERS_LIBS}
  gtest
  gtest_main
  log
)
target_link_libraries(SpeechToTextTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${TOKENIZERS_LIBS}
  z
  gtest
  gtest_main
  log
)
target_link_libraries(LLMTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${TOKENIZERS_LIBS}
  gtest
  gtest_main
  log
)
target_link_libraries(TextToImageTests
  PRIVATE
  ${ANDROID_THIRD_PARTY}/executorch/${ANDROID_ABI}/libexecutorch.so
  ${TOKENIZERS_LIBS}
  gtest
  gtest_main
  log
)

# Add 16kB page size
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-z,max-page-size=16384")

# Testing functionalities
enable_testing()
add_test(NAME NumericalTests COMMAND NumericalTests)
add_test(NAME LogTests COMMAND LogTests)
add_test(NAME BaseModelTests COMMAND BaseModelTests)
add_test(NAME ClassificationTests COMMAND ClassificationTests)
add_test(NAME ObjectDetectionTests COMMAND ObjectDetectionTests)
add_test(NAME ImageEmbeddingsTests COMMAND ImageEmbeddingsTests)
add_test(NAME TextEmbeddingsTests COMMAND TextEmbeddingsTests)
add_test(NAME StyleTransferTests COMMAND StyleTransferTests)
add_test(NAME VADTests COMMAND VADTests)
add_test(NAME TokenizerModuleTests COMMAND TokenizerModuleTests)
add_test(NAME SpeechToTextTests COMMAND SpeechToTextTests)
add_test(NAME LLMTests COMMAND LLMTests)
# add_test(NAME ImageSegmentationTests COMMAND ImageSegmentationTests)
add_test(NAME TextToImageTests COMMAND TextToImageTests)
