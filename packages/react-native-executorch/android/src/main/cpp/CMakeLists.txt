cmake_minimum_required(VERSION 3.13)

file(GLOB_RECURSE ANDROID_CPP_SOURCES CONFIGURE_DEPENDS "${ANDROID_CPP_DIR}/*.cpp")

# --- Source separation ---
# Glob all common sources, then separate opencv-dependent and phonemizer-dependent
# files so they can be conditionally included based on feature flags.

file(GLOB_RECURSE ALL_COMMON_CPP_SOURCES CONFIGURE_DEPENDS "${COMMON_CPP_DIR}/*.cpp")
file(GLOB_RECURSE ALL_COMMON_C_SOURCES   CONFIGURE_DEPENDS "${COMMON_CPP_DIR}/*.c")

# Exclude test sources unconditionally
file(GLOB_RECURSE TEST_CPP_SOURCES "${COMMON_CPP_DIR}/rnexecutorch/tests/*.cpp")
list(REMOVE_ITEM ALL_COMMON_CPP_SOURCES ${TEST_CPP_SOURCES})

# OpenCV-dependent sources: CV models + frame utilities + image processing
file(GLOB_RECURSE OPENCV_CPP_SOURCES CONFIGURE_DEPENDS
  "${COMMON_CPP_DIR}/rnexecutorch/models/classification/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/object_detection/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/semantic_segmentation/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/instance_segmentation/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/style_transfer/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/ocr/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/vertical_ocr/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/embeddings/image/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/text_to_image/*.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/models/VisionModel.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/data_processing/ImageProcessing.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/utils/FrameExtractor.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/utils/FrameProcessor.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/utils/FrameTransform.cpp"
  "${COMMON_CPP_DIR}/rnexecutorch/utils/computer_vision/*.cpp"
  "${COMMON_CPP_DIR}/runner/encoders/vision_encoder.cpp"
  "${COMMON_CPP_DIR}/runner/multimodal_prefiller.cpp"
  "${COMMON_CPP_DIR}/runner/multimodal_runner.cpp"
)

# Phonemizer-dependent sources: Kokoro TTS (only user of phonemis)
file(GLOB_RECURSE PHONEMIZER_CPP_SOURCES CONFIGURE_DEPENDS
  "${COMMON_CPP_DIR}/rnexecutorch/models/text_to_speech/*.cpp"
)

# Core = everything minus optional sources
set(CORE_COMMON_CPP_SOURCES ${ALL_COMMON_CPP_SOURCES})
list(REMOVE_ITEM CORE_COMMON_CPP_SOURCES ${OPENCV_CPP_SOURCES} ${PHONEMIZER_CPP_SOURCES})

# Build final source list
set(ENABLED_COMMON_SOURCES ${CORE_COMMON_CPP_SOURCES})

if(RNE_ENABLE_OPENCV)
  list(APPEND ENABLED_COMMON_SOURCES ${OPENCV_CPP_SOURCES})
endif()

if(RNE_ENABLE_PHONEMIZER)
  list(APPEND ENABLED_COMMON_SOURCES ${PHONEMIZER_CPP_SOURCES})
endif()

add_library(react-native-executorch SHARED
  ${ANDROID_CPP_SOURCES}
  ${ENABLED_COMMON_SOURCES}
  ${ALL_COMMON_C_SOURCES}
)

# Propagate feature flags as preprocessor defines so C++ code can guard includes
if(RNE_ENABLE_OPENCV)
  target_compile_definitions(react-native-executorch PRIVATE RNE_ENABLE_OPENCV)
endif()

if(RNE_ENABLE_PHONEMIZER)
  target_compile_definitions(react-native-executorch PRIVATE RNE_ENABLE_PHONEMIZER)
endif()

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

target_include_directories(
  react-native-executorch
  PUBLIC
  "${COMMON_CPP_DIR}"
  "${ANDROID_CPP_DIR}"
  "${INCLUDE_DIR}"
  "${TOKENIZERS_DIR}"
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

# ------- Executorch (always required) -------

add_library(executorch SHARED IMPORTED)

set_target_properties(executorch PROPERTIES
                      IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libexecutorch.so")

# XNNPACK is baked into libexecutorch.so. Vulkan ships as a separate
# libvulkan_executorch_backend.so loaded at runtime from ETInstaller via
# System.loadLibrary when RNE_ENABLE_VULKAN is ON; CMake here still declares
# the import target so jniLibs gets packaged.

if(ANDROID_ABI STREQUAL "arm64-v8a")
  target_compile_definitions(react-native-executorch PRIVATE ARCH_ARM64)
endif()

# pthreadpool and cpuinfo are statically linked into libexecutorch.so,
# no separate shared libraries needed.

# ------- Vulkan backend (optional) -------

if(RNE_ENABLE_VULKAN)
  add_library(vulkan_executorch_backend SHARED IMPORTED)
  set_target_properties(vulkan_executorch_backend PROPERTIES
    IMPORTED_LOCATION
    "${LIBS_DIR}/executorch/${ANDROID_ABI}/libvulkan_executorch_backend.so")
endif()

# ------- OpenCV (optional) -------

if(RNE_ENABLE_OPENCV)
  set(OPENCV_LINK_LIBS
    "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_core.a"
    "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_features2d.a"
    "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_highgui.a"
    "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_imgproc.a"
    "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_photo.a"
    "${LIBS_DIR}/opencv/${ANDROID_ABI}/libopencv_video.a"
  )

  if(ANDROID_ABI STREQUAL "arm64-v8a")
    list(APPEND OPENCV_LINK_LIBS
      "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv_hal.a"
      "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv_thread.a"
      "${LIBS_DIR}/opencv-third-party/${ANDROID_ABI}/libkleidicv.a"
    )
  endif()
endif()

# ------- Phonemizer (optional) -------

if(RNE_ENABLE_PHONEMIZER)
  set(PHONEMIZER_LINK_LIBS
    "${LIBS_DIR}/phonemis/${ANDROID_ABI}/libphonemis.a"
  )
endif()

# --------------

target_link_options(react-native-executorch PRIVATE -fopenmp -static-openmp)

target_link_libraries(
  react-native-executorch
  ${LINK_LIBRARIES}
  ${RN_VERSION_LINK_LIBRARIES}
  ${OPENCV_LINK_LIBS}
  ${PHONEMIZER_LINK_LIBS}
  executorch
  z
)

# Linking against the Vulkan backend SO (when enabled) makes Gradle bundle it
# into the APK and instructs the dynamic linker to load it whenever
# libreact-native-executorch.so is loaded. The .so's load-time constructors
# then register the Vulkan backend with libexecutorch.so's backend registry.
if(RNE_ENABLE_VULKAN)
  target_link_libraries(react-native-executorch vulkan_executorch_backend)
endif()
