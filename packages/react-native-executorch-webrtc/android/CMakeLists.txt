cmake_minimum_required(VERSION 3.13)
project(react-native-executorch-webrtc)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Paths to react-native-executorch
set(RN_EXECUTORCH_DIR "${CMAKE_SOURCE_DIR}/../../react-native-executorch")
set(RN_EXECUTORCH_THIRD_PARTY "${RN_EXECUTORCH_DIR}/third-party/include")

# Add our JNI bridge source files
file(GLOB SOURCES "src/main/cpp/*.cpp")

add_library(
  ${CMAKE_PROJECT_NAME}
  SHARED
  ${SOURCES}
)

# Find packages - ReactAndroid provides JSI headers
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(react-native-executorch REQUIRED CONFIG)

# Include headers
target_include_directories(
  ${CMAKE_PROJECT_NAME}
  PRIVATE
  "${RN_EXECUTORCH_DIR}/common"
  "${RN_EXECUTORCH_THIRD_PARTY}"
)

# Find prebuilt libraries
find_library(LOG_LIB log)
find_library(ANDROID_LIB android)

# Import ExecuTorch library
set(LIBS_DIR "${RN_EXECUTORCH_DIR}/third-party/android/libs")
add_library(executorch SHARED IMPORTED)
set_target_properties(executorch PROPERTIES
  IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libexecutorch.so")

# OpenCV libraries
set(OPENCV_LIBS
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_core.a"
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_imgproc.a"
)

# OpenCV third-party libraries (arm64 specific)
if(ANDROID_ABI STREQUAL "arm64-v8a")
  set(OPENCV_THIRD_PARTY_LIBS
    "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv_hal.a"
    "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv_thread.a"
    "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv.a"
  )
else()
  set(OPENCV_THIRD_PARTY_LIBS "")
endif()

# OpenMP for OpenCV parallel operations
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -fopenmp -static-openmp)

# Link against libraries
target_link_libraries(
  ${CMAKE_PROJECT_NAME}
  ${LOG_LIB}
  ${ANDROID_LIB}
  ReactAndroid::jsi
  ReactAndroid::reactnative
  fbjni::fbjni
  react-native-executorch::react-native-executorch
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  executorch
)

# Ensure react-native-executorch symbols are exported (needed for BaseModel/BaseSemanticSegmentation)
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -Wl,--no-as-needed)
