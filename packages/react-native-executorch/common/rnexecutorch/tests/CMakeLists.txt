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

# Source files
set(SOURCE_FILES ${CMAKE_SOURCE_DIR}/../data_processing/Numerical.cpp
                 ${CMAKE_SOURCE_DIR}/../data_processing/FileUtils.h)
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

# Add 16kB page size
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-z,max-page-size=16384")

# Testing functionalities
enable_testing()
add_test(NAME NumericalTests COMMAND NumericalTests)
add_test(NAME FileUtilsTests COMMAND FileUtilsTests)
add_test(NAME LogTests COMMAND LogTests)
add_test(NAME BaseModelTests COMMAND BaseModelTests)
add_test(NAME ClassificationTests COMMAND ClassificationTests)
add_test(NAME ObjectDetectionTests COMMAND ObjectDetectionTests)
