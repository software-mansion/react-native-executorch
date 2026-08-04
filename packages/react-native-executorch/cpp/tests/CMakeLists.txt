cmake_minimum_required(VERSION 3.24)
project(RnExecutorchTests CXX)

# Host-side unit tests for the package's C++ sources.
#
# The native code is entirely JSI-facing: every entry point takes a
# jsi::Runtime&. Rather than stub that boundary, the tests link a real Hermes
# runtime (the engine RN ships) and a host build of ExecuTorch, install the
# production `rnexecutorch` module into it, and drive it exactly the way the
# TypeScript layer does. See README.md for the provisioning story.

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(PACKAGE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../..")
set(CPP_DIR "${PACKAGE_DIR}/cpp")
set(REPO_ROOT "${PACKAGE_DIR}/../..")
set(INCLUDE_DIR "${PACKAGE_DIR}/third-party/include")

# Prebuilt dependencies produced by scripts/build-native-test-deps.sh. Kept out
# of the CMake build so a dependency rebuild (~2 min) is not part of every
# configure, and so CI can cache the directory wholesale.
set(RNE_TEST_DEPS_DIR "${PACKAGE_DIR}/.native-test-deps"
    CACHE PATH "Directory holding the prebuilt Hermes and ExecuTorch host dependencies")

option(RNE_TESTS_ENABLE_OPENCV "Build the OpenCV-dependent extension tests" ON)

if(NOT EXISTS "${INCLUDE_DIR}")
  message(FATAL_ERROR
    "third-party/include is missing. Provision it with:\n"
    "  RNET_HEADERS_ONLY=1 node scripts/download-libs.js")
endif()

set(HERMES_SRC_DIR "${RNE_TEST_DEPS_DIR}/hermes/src")
set(HERMES_BUILD_DIR "${RNE_TEST_DEPS_DIR}/hermes/build")
# ExecuTorch's own CMake requires its source directory to be named exactly
# `executorch`, so it sits flat rather than under a src/build pair.
set(ET_BUILD_DIR "${RNE_TEST_DEPS_DIR}/executorch-build")

if(NOT EXISTS "${HERMES_BUILD_DIR}" OR NOT EXISTS "${ET_BUILD_DIR}")
  message(FATAL_ERROR
    "Test dependencies are missing from ${RNE_TEST_DEPS_DIR}. Build them with:\n"
    "  scripts/build-native-test-deps.sh")
endif()

# --- GoogleTest -------------------------------------------------------------
# Vendored as a submodule at the repo root, so the tests add no network
# dependency of their own beyond the two host toolchains above.
set(GTEST_DIR "${REPO_ROOT}/third-party/googletest")
if(NOT EXISTS "${GTEST_DIR}/CMakeLists.txt")
  message(FATAL_ERROR
    "third-party/googletest is empty. Initialise it with:\n"
    "  git submodule update --init third-party/googletest")
endif()
set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
add_subdirectory("${GTEST_DIR}" "${CMAKE_BINARY_DIR}/googletest" EXCLUDE_FROM_ALL)

# --- Hermes -----------------------------------------------------------------
# Hermes vendors its own copy of JSI, so linking it supplies both the engine and
# the jsi headers/symbols the package compiles against.
add_library(hermes_host SHARED IMPORTED)
find_library(HERMES_VM_LIB
  NAMES hermesvm
  PATHS "${HERMES_BUILD_DIR}/lib" "${HERMES_BUILD_DIR}/API/hermes"
  NO_DEFAULT_PATH REQUIRED)
set_target_properties(hermes_host PROPERTIES IMPORTED_LOCATION "${HERMES_VM_LIB}")
target_include_directories(hermes_host INTERFACE
  "${HERMES_SRC_DIR}/API"
  "${HERMES_SRC_DIR}/API/jsi"
  "${HERMES_SRC_DIR}/public")

find_library(HERMES_JSI_LIB
  NAMES jsi
  PATHS "${HERMES_BUILD_DIR}/jsi" "${HERMES_BUILD_DIR}/lib"
  NO_DEFAULT_PATH REQUIRED)
add_library(hermes_jsi_host SHARED IMPORTED)
set_target_properties(hermes_jsi_host PROPERTIES IMPORTED_LOCATION "${HERMES_JSI_LIB}")

# --- ExecuTorch -------------------------------------------------------------
# Only the handful of libraries the package actually pulls in: tensor creation,
# module loading, and the LLM tokenizers used by the nlp extension.
function(rne_import_et_lib target relative_path)
  find_library(${target}_LIB
    NAMES ${ARGN}
    PATHS "${ET_BUILD_DIR}/${relative_path}"
    NO_DEFAULT_PATH REQUIRED)
  add_library(${target} STATIC IMPORTED)
  set_target_properties(${target} PROPERTIES IMPORTED_LOCATION "${${target}_LIB}")
endfunction()

rne_import_et_lib(et_core "" executorch_core)
rne_import_et_lib(et_full "" executorch)
rne_import_et_lib(et_tensor "extension/tensor" extension_tensor)
rne_import_et_lib(et_module "extension/module" extension_module_static extension_module)
rne_import_et_lib(et_data_loader "extension/data_loader" extension_data_loader)
rne_import_et_lib(et_flat_tensor "extension/flat_tensor" extension_flat_tensor)
rne_import_et_lib(et_named_data_map "extension/named_data_map" extension_named_data_map)
rne_import_et_lib(et_tokenizers "extension/llm/tokenizers" tokenizers)

set(ET_LIBS
  et_module et_tensor et_flat_tensor et_named_data_map et_data_loader
  et_full et_core et_tokenizers)

# The tokenizers library links re2 + abseil, built as part of the ExecuTorch
# tree. Glob them rather than naming ~20 abseil targets individually.
file(GLOB ET_RE2_LIBS "${ET_BUILD_DIR}/extension/llm/tokenizers/third-party/re2/libre2.a")
file(GLOB ET_ABSEIL_LIBS "${ET_BUILD_DIR}/extension/llm/tokenizers/third-party/abseil-cpp/absl/*/*.a")
file(GLOB ET_JSON_LIBS "${ET_BUILD_DIR}/extension/llm/tokenizers/third-party/*/lib*.a")

# Attach them to et_tokenizers rather than to each test executable, so CMake
# emits them *after* libtokenizers.a. GNU ld resolves archives left to right and
# only pulls members that satisfy an already-undefined symbol, so listing re2
# ahead of its consumer silently produces undefined references at link time;
# Apple's linker searches regardless of order, which hides this on macOS.
#
# --start-group additionally lets the linker rescan the set, covering the
# reference cycles between the abseil archives (the glob above cannot order them
# topologically). It is a GNU ld feature; Apple's linker neither needs nor
# accepts it.
set(TOKENIZER_DEP_LIBS ${ET_RE2_LIBS} ${ET_ABSEIL_LIBS} ${ET_JSON_LIBS})
if(NOT APPLE AND TOKENIZER_DEP_LIBS)
  set(TOKENIZER_DEP_LIBS "-Wl,--start-group" ${TOKENIZER_DEP_LIBS} "-Wl,--end-group")
endif()
set_property(TARGET et_tokenizers APPEND PROPERTY
  INTERFACE_LINK_LIBRARIES ${TOKENIZER_DEP_LIBS})

# --- Sources under test -----------------------------------------------------
# Mirrors android/CMakeLists.txt: core/math/nlp/speech always, cv behind the
# OpenCV flag. Built as one static library so every test binary shares it.
file(GLOB CORE_SOURCES   "${CPP_DIR}/core/*.cpp")
file(GLOB MATH_SOURCES   "${CPP_DIR}/extensions/math/*.cpp")
file(GLOB NLP_SOURCES    "${CPP_DIR}/extensions/nlp/*.cpp")
file(GLOB SPEECH_SOURCES "${CPP_DIR}/extensions/speech/*.cpp")
file(GLOB OPENCV_SOURCES "${CPP_DIR}/extensions/cv/*.cpp")

set(RNE_SOURCES
  "${CPP_DIR}/RnExecutorch.cpp"
  ${CORE_SOURCES} ${MATH_SOURCES} ${NLP_SOURCES} ${SPEECH_SOURCES})

# The cv extension uses only core and imgproc. Prefer OpenCV's CMake package
# when it is installed (Homebrew, or a full distro OpenCV), but fall back to
# locating the two libraries directly: on Debian/Ubuntu OpenCVConfig.cmake ships
# only in the `libopencv-dev` meta-package, which hard-depends on the viz and
# contrib modules and so drags in VTK, OpenMPI and ~220 packages. The fallback
# lets CI install just libopencv-{core,imgproc}-dev instead.
# Sets RNE_OPENCV_INCLUDE_DIRS in the caller's scope; the include directories are
# deliberately kept off the rne_opencv target so the caller can place them ahead
# of third-party/include (see the note where they are applied).
function(rne_find_opencv)
  add_library(rne_opencv INTERFACE)

  find_package(OpenCV QUIET COMPONENTS core imgproc)
  if(OpenCV_FOUND)
    message(STATUS "OpenCV: using CMake package ${OpenCV_VERSION}")
    # OpenCV's imported targets mark their include directory SYSTEM, which would
    # put it on -isystem — searched only after the vendored opencv2 headers.
    # Clearing that keeps it on -I, where it takes precedence.
    foreach(lib IN LISTS OpenCV_LIBS)
      if(TARGET ${lib})
        set_target_properties(${lib} PROPERTIES IMPORTED_NO_SYSTEM ON)
      endif()
    endforeach()
    set(RNE_OPENCV_INCLUDE_DIRS ${OpenCV_INCLUDE_DIRS} PARENT_SCOPE)
    target_link_libraries(rne_opencv INTERFACE ${OpenCV_LIBS})
    return()
  endif()

  find_path(OPENCV_INCLUDE_DIR
    NAMES opencv2/core.hpp
    PATH_SUFFIXES opencv4)
  find_library(OPENCV_CORE_LIB NAMES opencv_core)
  find_library(OPENCV_IMGPROC_LIB NAMES opencv_imgproc)

  if(NOT OPENCV_INCLUDE_DIR OR NOT OPENCV_CORE_LIB OR NOT OPENCV_IMGPROC_LIB)
    message(FATAL_ERROR
      "OpenCV (core + imgproc) not found. Install it with:\n"
      "  brew install opencv\n"
      "  apt-get install libopencv-core-dev libopencv-imgproc-dev\n"
      "or configure with -DRNE_TESTS_ENABLE_OPENCV=OFF to skip the cv suite.")
  endif()

  message(STATUS "OpenCV: using ${OPENCV_CORE_LIB}")
  set(RNE_OPENCV_INCLUDE_DIRS "${OPENCV_INCLUDE_DIR}" PARENT_SCOPE)
  target_link_libraries(rne_opencv INTERFACE "${OPENCV_CORE_LIB}" "${OPENCV_IMGPROC_LIB}")
endfunction()

if(RNE_TESTS_ENABLE_OPENCV)
  rne_find_opencv()
  list(APPEND RNE_SOURCES ${OPENCV_SOURCES})
endif()

add_library(rne_under_test STATIC ${RNE_SOURCES})

target_include_directories(rne_under_test PUBLIC "${CPP_DIR}")

# Vendored third-party headers are SYSTEM, matching compile_flags.txt: it keeps
# their warnings (e.g. ExecuTorch's deprecated members) out of our build output,
# and it puts them on -isystem, which is searched only after every -I. That is
# what lets the installed OpenCV's -I below take precedence over the opencv2
# headers that also live under ${INCLUDE_DIR}.
target_include_directories(rne_under_test SYSTEM PUBLIC
  "${INCLUDE_DIR}"
  "${INCLUDE_DIR}/executorch/extension/llm/tokenizers/include"
  "${INCLUDE_DIR}/executorch/extension/llm/tokenizers/third-party/json/include"
  "${INCLUDE_DIR}/executorch/extension/llm/tokenizers/third-party/re2"
  "${INCLUDE_DIR}/executorch/extension/llm/tokenizers/third-party/abseil-cpp")

target_link_libraries(rne_under_test PUBLIC hermes_host hermes_jsi_host ${ET_LIBS})

# Hermes' platform layer (time zones, unicode) is backed by CoreFoundation on
# Apple platforms.
if(APPLE)
  target_link_libraries(rne_under_test PUBLIC "-framework CoreFoundation")
endif()

if(RNE_TESTS_ENABLE_OPENCV)
  target_compile_definitions(rne_under_test PUBLIC RNE_ENABLE_OPENCV)
  target_link_libraries(rne_under_test PUBLIC rne_opencv)

  # third-party/include ships its own opencv2/ headers (currently 4.13) for the
  # Android/iOS builds, which link matching vendored libraries. On the host we
  # link whatever OpenCV is installed, so those headers must not win the include
  # search, or we compile against one version and link another: Ubuntu's 4.6 has
  # no cvtColor(..., AlgorithmHint) overload, which 4.10+ headers resolve to, and
  # the mismatch surfaces only as an undefined symbol at link time.
  #
  # Added as a plain -I (not via the linked target, which would make it
  # -isystem): every -I is searched before every -isystem, so this reliably wins
  # over the vendored opencv2 headers regardless of listed order.
  if(NOT RNE_OPENCV_INCLUDE_DIRS)
    message(FATAL_ERROR "OpenCV include directory not resolved; cannot order it "
                        "ahead of the vendored opencv2 headers.")
  endif()
  target_include_directories(rne_under_test PUBLIC ${RNE_OPENCV_INCLUDE_DIRS})
endif()

# --- Test support -----------------------------------------------------------
add_library(rne_test_support STATIC support/JsiTestEnv.cpp)
target_link_libraries(rne_test_support PUBLIC rne_under_test gtest gmock)
target_include_directories(rne_test_support PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")

# --- Model fixture ----------------------------------------------------------
# Suites that read ExecuTorch MethodMeta need a real .pte. It is downloaded
# rather than committed (scripts/fetch-test-fixtures.sh), so the suites that
# need it are dropped with a warning when it is absent instead of failing the
# whole configure.
set(MODEL_FIXTURE "${CMAKE_CURRENT_SOURCE_DIR}/fixtures/selfie_segmentation_xnnpack_fp32.pte")
if(EXISTS "${MODEL_FIXTURE}")
  set(RNE_HAVE_MODEL_FIXTURE ON)
  target_compile_definitions(rne_test_support PUBLIC
    RNE_MODEL_FIXTURE="${MODEL_FIXTURE}")
else()
  set(RNE_HAVE_MODEL_FIXTURE OFF)
  message(WARNING
    "Model fixture missing, skipping the ModelTest suite. Fetch it with:\n"
    "  scripts/fetch-test-fixtures.sh")
endif()

# --- Test binaries ----------------------------------------------------------
enable_testing()
include(GoogleTest)

# One binary per suite keeps a crash in a single area from taking the whole run
# down, and lets `ctest -R` target a suite directly.
set(TEST_SUITES
  core/DTypeTest.cpp
  core/ConversionsTest.cpp
  core/TensorTest.cpp
  core/SchemaTest.cpp
  extensions/MathOpsTest.cpp
  extensions/SpeechOpsTest.cpp)

if(RNE_TESTS_ENABLE_OPENCV)
  list(APPEND TEST_SUITES extensions/CvOpsTest.cpp)
endif()

if(RNE_HAVE_MODEL_FIXTURE)
  list(APPEND TEST_SUITES core/ModelTest.cpp)
endif()

foreach(suite_path IN LISTS TEST_SUITES)
  get_filename_component(suite_name "${suite_path}" NAME_WE)
  add_executable(${suite_name} "${suite_path}")
  # re2/abseil come in transitively via et_tokenizers, which places them after
  # their consumer — see the note by TOKENIZER_DEP_LIBS.
  target_link_libraries(${suite_name} PRIVATE rne_test_support gtest_main)
  gtest_discover_tests(${suite_name} DISCOVERY_TIMEOUT 60)
endforeach()
