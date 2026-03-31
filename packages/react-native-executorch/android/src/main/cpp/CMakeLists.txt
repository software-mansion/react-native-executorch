cmake_minimum_required(VERSION 3.13)

file(GLOB_RECURSE ANDROID_CPP_SOURCES CONFIGURE_DEPENDS "${ANDROID_CPP_DIR}/*.cpp")
file(GLOB_RECURSE COMMON_CPP_SOURCES CONFIGURE_DEPENDS "${COMMON_CPP_DIR}/*.cpp")
file(GLOB_RECURSE COMMON_C_SOURCES CONFIGURE_DEPENDS "${COMMON_CPP_DIR}/*.c")
file(GLOB_RECURSE TEST_CPP_SOURCES "${COMMON_CPP_DIR}/rnexecutorch/tests/*.cpp")
list(REMOVE_ITEM COMMON_CPP_SOURCES ${TEST_CPP_SOURCES})

add_library(react-native-executorch SHARED ${ANDROID_CPP_SOURCES} ${COMMON_CPP_SOURCES} ${COMMON_C_SOURCES})

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

# Dependencies:

# ------- Executorch -------

# libexecutorch.so is the thin JNI wrapper (JNI_OnLoad + ASR entry points).
# It has a hard NEEDED dependency on libqnn_executorch_backend.so, so both must be bundled.
# All other runtime symbols are statically linked from executorch-static/*.a below.
add_library(executorch SHARED IMPORTED)
set_target_properties(executorch PROPERTIES
                      IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libexecutorch.so")


set(EXECUTORCH_STATIC_DIR "${LIBS_DIR}/executorch-static/${ANDROID_ABI}")

# Libs that use static constructors for kernel/backend registration — must use --whole-archive
# so registrations are not stripped by the linker.
set(EXECUTORCH_WHOLE_ARCHIVE_LIBS
  "${EXECUTORCH_STATIC_DIR}/liboptimized_native_cpu_ops_lib.a"
  "${EXECUTORCH_STATIC_DIR}/libxnnpack_backend.a"
  "${EXECUTORCH_STATIC_DIR}/libvulkan_backend.a"
  "${EXECUTORCH_STATIC_DIR}/libexecutorch.a"
)

# Libs linked normally — only pull in symbols that are referenced.
# Do NOT include libs whose symbols are already compiled by this project
# (e.g. libextension_llm_runner, libextension_llm_sampler, libportable_kernels
# overlap with common/runner/*.cpp).
set(EXECUTORCH_STATIC_LIBS
  "${EXECUTORCH_STATIC_DIR}/libexecutorch_core.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_module.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_tensor.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_threadpool.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_data_loader.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_runner_util.a"
  "${EXECUTORCH_STATIC_DIR}/libtokenizers.a"
  "${EXECUTORCH_STATIC_DIR}/libsentencepiece.a"
  "${EXECUTORCH_STATIC_DIR}/libportable_kernels.a"
  "${EXECUTORCH_STATIC_DIR}/liboptimized_kernels.a"
  "${EXECUTORCH_STATIC_DIR}/libXNNPACK.a"
  "${EXECUTORCH_STATIC_DIR}/libxnnpack-microkernels-prod.a"
  "${EXECUTORCH_STATIC_DIR}/libre2.a"
  "${EXECUTORCH_STATIC_DIR}/libcpublas.a"
  "${EXECUTORCH_STATIC_DIR}/libeigen_blas.a"
  "${EXECUTORCH_STATIC_DIR}/libpthreadpool.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_flat_tensor.a"
  "${EXECUTORCH_STATIC_DIR}/libextension_named_data_map.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_message.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_globals.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_log_sink_set.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_format.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_check_op.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_conditions.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_nullguard.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_internal_proto.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_globals.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_entry.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_sink.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_initialize.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_log_flags.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_str_format_internal.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_strings.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_strings_internal.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_base.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_raw_logging_internal.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_spinlock_wait.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_synchronization.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_symbolize.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_stacktrace.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_int128.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_time.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_time_zone.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_throw_delegate.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_status.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_statusor.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_malloc_internal.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_raw_hash_set.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_hash.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_kernel_timeout_internal.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_examine_stack.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_strerror.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_city.a"
  "${EXECUTORCH_STATIC_DIR}/libabsl_low_level_hash.a"
)

if(ANDROID_ABI STREQUAL "arm64-v8a")
  target_compile_definitions(react-native-executorch PRIVATE ARCH_ARM64)

  # ------- cpuinfo -------
  add_library(cpuinfo SHARED IMPORTED)
  set_target_properties(cpuinfo PROPERTIES
                        IMPORTED_LOCATION "${LIBS_DIR}/cpuinfo/${ANDROID_ABI}/libcpuinfo.so")

  # ------- QNN backend -------
  add_library(qnn_executorch_backend SHARED IMPORTED)
  set_target_properties(qnn_executorch_backend PROPERTIES
                        IMPORTED_LOCATION "${LIBS_DIR}/executorch/${ANDROID_ABI}/libqnn_executorch_backend.so")

  set(EXECUTORCH_LIBS
    "cpuinfo"
    "qnn_executorch_backend"
  )

  # kleidiai is ARM-only (Kleidi AI acceleration library)
  list(APPEND EXECUTORCH_STATIC_LIBS "${EXECUTORCH_STATIC_DIR}/libkleidiai.a")
endif()

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


# ------- phonemis -------

set(PHONEMIS_LIBS
  "${LIBS_DIR}/phonemis/${ANDROID_ABI}/libphonemis.a"
)

# --------------

target_link_options(react-native-executorch PRIVATE -fopenmp -static-openmp)

target_link_libraries(
  react-native-executorch
  ${LINK_LIBRARIES}
  ${RN_VERSION_LINK_LIBRARIES}
  ${OPENCV_LIBS}
  ${OPENCV_THIRD_PARTY_LIBS}
  ${PHONEMIS_LIBS}
  -Wl,--whole-archive
  ${EXECUTORCH_WHOLE_ARCHIVE_LIBS}
  -Wl,--no-whole-archive
  ${EXECUTORCH_STATIC_LIBS}
  executorch
  ${EXECUTORCH_LIBS}
  vulkan
  z
)
