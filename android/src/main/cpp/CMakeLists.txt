cmake_minimum_required(VERSION 3.13)

file(GLOB_RECURSE ANDROID_CPP_SOURCES CONFIGURE_DEPENDS "${ANDROID_CPP_DIR}/*.cpp")
file(GLOB_RECURSE COMMON_CPP_SOURCES CONFIGURE_DEPENDS "${COMMON_CPP_DIR}/*.cpp" "${COMMON_CPP_DIR}/*.c")

add_library(react-native-executorch SHARED ${ANDROID_CPP_SOURCES} ${COMMON_CPP_SOURCES})

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

target_include_directories(
  react-native-executorch
  PUBLIC
  "${COMMON_CPP_DIR}"
  "${ANDROID_CPP_DIR}"
  "${ET_INCLUDE_DIR}"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
  "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
  "${BUILD_DIR}/generated/source/codegen/jni/react/renderer/components/RnExecutorchSpec"
)

set(LINK_LIBRARIES
  ReactAndroid::jsi
  fbjni::fbjni
  android
  log
)

set(RN_VERSION_LINK_LIBRARIES
  ReactAndroid::reactnative
)

add_library(executorch SHARED IMPORTED)

set_target_properties(executorch PROPERTIES
                      IMPORTED_LOCATION "${ET_LIB_DIR}/${ANDROID_ABI}/libexecutorch.so")

target_link_libraries(
  react-native-executorch 
  ${LINK_LIBRARIES} 
  ${RN_VERSION_LINK_LIBRARIES}
  executorch
)