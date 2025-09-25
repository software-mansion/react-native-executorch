cmake_minimum_required(VERSION 3.13)
project(RnExecutorch)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})

string(APPEND CMAKE_CXX_FLAGS " -DRCT_NEW_ARCH_ENABLED")

set(ANDROID_CPP_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../common")
set(LIBS_DIR "${CMAKE_SOURCE_DIR}/../third-party/android/libs")
set(INCLUDE_DIR "${CMAKE_SOURCE_DIR}/../third-party/include")

# Treat third-party headers as system headers to suppress deprecation warnings
include_directories(SYSTEM "${INCLUDE_DIR}")

add_subdirectory("${ANDROID_CPP_DIR}")
