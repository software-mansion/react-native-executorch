cmake_minimum_required(VERSION 3.13)

file(GLOB_RECURSE ANDROID_CPP_SOURCES CONFIGURE_DEPENDS "${ANDROID_CPP_DIR}/*.cpp")
file(GLOB_RECURSE COMMON_CPP_SOURCES CONFIGURE_DEPENDS "${COMMON_CPP_DIR}/*.cpp" "${COMMON_CPP_DIR}/*.c")
file(GLOB_RECURSE TEST_CPP_SOURCES "${COMMON_CPP_DIR}/rnexecutorch/tests/*.cpp")
list(REMOVE_ITEM COMMON_CPP_SOURCES ${TEST_CPP_SOURCES})

add_library(react-native-executorch SHARED ${ANDROID_CPP_SOURCES} ${COMMON_CPP_SOURCES})

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

target_include_directories(
  react-native-executorch
  PUBLIC
  "${COMMON_CPP_DIR}"
  "${ANDROID_CPP_DIR}"
  "${INCLUDE_DIR}"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
  "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
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

# Dependencies:
# ------- pthreadpool -------
add_library(pthreadpool SHARED IMPORTED)
set_target_properties(pthreadpool PROPERTIES
                      IMPORTED_LOCATION "${LIBS_DIR}/pthreadpool/${ANDROID_ABI}/libpthreadpool.so"
                      INTERFACE_INCLUDE_DIRECTORIES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../third-party/executorch/backends/xnnpack/third-party/pthreadpool/include")

# ------- cpuinfo -------
add_library(cpuinfo SHARED IMPORTED)
set_target_properties(cpuinfo PROPERTIES
                      IMPORTED_LOCATION "${LIBS_DIR}/cpuinfo/${ANDROID_ABI}/libcpuinfo.so"
                      INTERFACE_INCLUDE_DIRECTORIES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../third-party/executorch/backends/xnnpack/third-party/cpuinfo/include")

# ------- Executorch -------

add_library(executorch SHARED IMPORTED)

set_target_properties(executorch PROPERTIES
                      IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libexecutorch.so")

# ------- OpenCV -------

set(OPENCV_LIBS 
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_core.a"
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_features2d.a"
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_highgui.a"
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_imgproc.a"
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_photo.a"
  "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_video.a"
)

if(ANDROID_ABI STREQUAL "arm64-v8a")
  set(OPENCV_THIRD_PARTY_LIBS
    "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv_hal.a"
    "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv_thread.a"
    "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv.a"
  )
elseif(ANDROID_ABI STREQUAL "x86_64")
  set(OPENCV_THIRD_PARTY_LIBS "")
endif()

# --------------

target_link_libraries(
  react-native-executorch 
  ${LINK_LIBRARIES} 
  ${RN_VERSION_LINK_LIBRARIES}
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  executorch
  pthreadpool
  cpuinfo
)