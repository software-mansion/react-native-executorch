cmake_minimum_required(VERSION 3.13)
project(RnExecutorch)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

set(THIRD_PARTY_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../third-party")
set(LIBS_DIR "${THIRD_PARTY_DIR}/android/libs")
set(INCLUDE_DIR "${THIRD_PARTY_DIR}/include")
set(CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../cpp")

# Feature flags forwarded from build.gradle.kts (which reads rne-build-config.json
# written by scripts/download-libs.js). Default ON so a manual/full provisioning
# still builds everything.
option(RNE_ENABLE_OPENCV "Compile + link OpenCV-dependent sources" ON)
option(RNE_ENABLE_PHONEMIS "Compile phonemis (TTS) sources" ON)
option(RNE_ENABLE_XNNPACK "Link the XNNPACK backend shared library" ON)
option(RNE_ENABLE_VULKAN "Link the Vulkan backend shared library" ON)

find_package(ReactAndroid REQUIRED CONFIG)

# --- Source groups ---
# core/math/nlp are backend-agnostic and always compiled. OPENCV_SOURCES is the
# explicit, extensible list of opencv-dependent sources: when multimodal LLM
# lands in nlp, its vision-encoder sources should be appended here too.
file(GLOB CORE_SOURCES   ${CPP_DIR}/core/*.cpp)
file(GLOB MATH_SOURCES   ${CPP_DIR}/extensions/math/*.cpp)
file(GLOB NLP_SOURCES    ${CPP_DIR}/extensions/nlp/*.cpp)
file(GLOB SPEECH_SOURCES ${CPP_DIR}/extensions/speech/*.cpp ${CPP_DIR}/extensions/speech/*/*.cpp)
file(GLOB OPENCV_SOURCES ${CPP_DIR}/extensions/cv/*.cpp)


set(RNE_SOURCES
    ${CPP_DIR}/RnExecutorch.cpp
    ${CORE_SOURCES}
    ${MATH_SOURCES}
    ${NLP_SOURCES}
    ${SPEECH_SOURCES}
    cpp-adapter.cpp
)

if(RNE_ENABLE_OPENCV)
  list(APPEND RNE_SOURCES ${OPENCV_SOURCES})
endif()

add_library(${CMAKE_PROJECT_NAME} SHARED ${RNE_SOURCES})

target_compile_definitions(${CMAKE_PROJECT_NAME} PRIVATE
    C10_USING_CUSTOM_GENERATED_MACROS=1
    EXECUTORCH_ENABLE_EXECUTION_PROFILING=1
    ET_ON   # Phonemis
)

# Propagate feature flags as preprocessor defines so C++ can guard includes/calls.
if(RNE_ENABLE_OPENCV)
  target_compile_definitions(${CMAKE_PROJECT_NAME} PRIVATE RNE_ENABLE_OPENCV)
endif()
if(RNE_ENABLE_PHONEMIS)
  target_compile_definitions(${CMAKE_PROJECT_NAME} PRIVATE RNE_ENABLE_PHONEMIS)
endif()

target_include_directories(${CMAKE_PROJECT_NAME} PRIVATE
    ${CPP_DIR}
    ${INCLUDE_DIR}
    ${INCLUDE_DIR}/executorch/extension/llm/tokenizers/include
    ${INCLUDE_DIR}/executorch/extension/llm/tokenizers/third-party/json/include
    ${INCLUDE_DIR}/executorch/extension/llm/tokenizers/third-party/re2
    ${INCLUDE_DIR}/executorch/extension/llm/tokenizers/third-party/abseil-cpp
    ${THIRD_PARTY_DIR}/common/phonemis/src
)

set(ET_ON ON CACHE BOOL "Use ExecuTorch for phonemis neural inference" FORCE)

# ------- ExecuTorch core (always required) -------
add_library(executorch SHARED IMPORTED)
set_target_properties(executorch PROPERTIES
    IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libexecutorch.so")

# ------- XNNPACK backend (optional) -------
# Backends ship as separate .so files. When enabled, CMake imports the .so and
# links libreact-native-executorch.so against it; Gradle packages the .so into
# the APK (via jniLibs srcDir) and the dynamic linker loads it whenever
# libreact-native-executorch.so loads. Each backend .so's load-time constructor
# registers itself with libexecutorch.so's backend registry.
if(RNE_ENABLE_XNNPACK)
  add_library(xnnpack_executorch_backend SHARED IMPORTED)
  set_target_properties(xnnpack_executorch_backend PROPERTIES
      IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libxnnpack_executorch_backend.so")
endif()

# ------- Vulkan backend (optional) -------
if(RNE_ENABLE_VULKAN)
  add_library(vulkan_executorch_backend SHARED IMPORTED)
  set_target_properties(vulkan_executorch_backend PROPERTIES
      IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libvulkan_executorch_backend.so")
endif()

# ------- OpenCV (optional, static) -------
set(OPENCV_LINK_LIBS "")
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

# libexecutorch.so references OpenMP runtime symbols (optimized kernels). Link
# the static OpenMP runtime into libRnExecutorch.so to resolve them.
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -fopenmp -static-openmp)

add_subdirectory(${THIRD_PARTY_DIR}/common/phonemis/src
                 ${CMAKE_CURRENT_BINARY_DIR}/phonemis)

target_link_libraries(${CMAKE_PROJECT_NAME}
    ReactAndroid::jsi
    log
    ${OPENCV_LINK_LIBS}
    executorch
    phonemis
    z
)

# Linking against the backend .so (when enabled) makes Gradle bundle them and
# instructs the dynamic linker to load them with libreact-native-executorch.so.
if(RNE_ENABLE_XNNPACK)
  target_link_libraries(${CMAKE_PROJECT_NAME} xnnpack_executorch_backend)
endif()
if(RNE_ENABLE_VULKAN)
  target_link_libraries(${CMAKE_PROJECT_NAME} vulkan_executorch_backend)
endif()
