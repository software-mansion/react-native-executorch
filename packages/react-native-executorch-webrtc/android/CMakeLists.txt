cmake_minimum_required(VERSION 3.13)
project(react-native-executorch-webrtc)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Resolve React Native directory
if(NOT DEFINED REACT_NATIVE_DIR)
    # Try to find it via node
    execute_process(
        COMMAND node --print "require.resolve('react-native/package.json')"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE REACT_NATIVE_PACKAGE
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
    get_filename_component(REACT_NATIVE_DIR "${REACT_NATIVE_PACKAGE}" DIRECTORY)
endif()

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

# Include headers
target_include_directories(
  ${CMAKE_PROJECT_NAME}
  PRIVATE
  "${RN_EXECUTORCH_DIR}/common"
  "${RN_EXECUTORCH_THIRD_PARTY}"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactCommon/jsi"
  "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
)

# Find prebuilt libraries
find_library(LOG_LIB log)
find_library(ANDROID_LIB android)

# Find packages
find_package(react-native-executorch REQUIRED CONFIG)

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

# Link against libraries
target_link_libraries(
  ${CMAKE_PROJECT_NAME}
  ${LOG_LIB}
  ${ANDROID_LIB}
  react-native-executorch::react-native-executorch
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  executorch
)
