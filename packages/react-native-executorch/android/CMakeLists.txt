cmake_minimum_required(VERSION 3.13)
project(RnExecutorch)

set (CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set (CMAKE_CXX_STANDARD 20)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})


if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 80)
  include("${REACT_NATIVE_DIR}/ReactCommon/cmake-utils/react-native-flags.cmake")
  target_compile_reactnative_options(react-native-executorch PRIVATE)
else()
  string(APPEND CMAKE_CXX_FLAGS " -O2 -fstack-protector-all -fexceptions -frtti -std=c++${CMAKE_CXX_STANDARD} -Wall")
endif()

string(APPEND CMAKE_CXX_FLAGS " -DRCT_NEW_ARCH_ENABLED")

set(ANDROID_CPP_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../common")
set(LIBS_DIR "${CMAKE_SOURCE_DIR}/../third-party/android/libs")
set(TOKENIZERS_DIR "${CMAKE_SOURCE_DIR}/../third-party/include/executorch/extension/llm/tokenizers/include")
set(INCLUDE_DIR "${CMAKE_SOURCE_DIR}/../third-party/include")

# Optional feature flags — driven by user config in package.json, passed via gradle cmake arguments
option(RNE_ENABLE_OPENCV "Enable OpenCV-dependent computer vision features" ON)
option(RNE_ENABLE_PHONEMIZER "Enable Phonemizer-dependent TTS features" ON)
option(RNE_ENABLE_VULKAN "Load the Vulkan backend shared library" ON)

# Treat third-party headers as system headers to suppress deprecation warnings
include_directories(SYSTEM "${INCLUDE_DIR}")
include_directories(SYSTEM "${INCLUDE_DIR}/cpuinfo")
include_directories(SYSTEM "${INCLUDE_DIR}/pthreadpool")

add_subdirectory("${ANDROID_CPP_DIR}")
