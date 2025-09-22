cmake_minimum_required(VERSION 3.13)
project(react-native-executorch)

set (CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set (CMAKE_CXX_STANDARD 20)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})

string(APPEND CMAKE_CXX_FLAGS " -DRCT_NEW_ARCH_ENABLED")

if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 80)
  include("${REACT_NATIVE_DIR}/ReactCommon/cmake-utils/react-native-flags.cmake")
  target_compile_reactnative_options(react-native-executorch PRIVATE)
else()
  string(APPEND CMAKE_CXX_FLAGS " -fexceptions -frtti -std=c++${CMAKE_CXX_STANDARD} -Wall")
endif()

set(ANDROID_CPP_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../common")
set(LIBS_DIR "${CMAKE_SOURCE_DIR}/../third-party/android/libs")
set(INCLUDE_DIR "${CMAKE_SOURCE_DIR}/../third-party/include")

add_subdirectory("${ANDROID_CPP_DIR}")
