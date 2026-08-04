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

if(RNE_TESTS_ENABLE_OPENCV)
  find_package(OpenCV REQUIRED COMPONENTS core imgproc)
  list(APPEND RNE_SOURCES ${OPENCV_SOURCES})
endif()

add_library(rne_under_test STATIC ${RNE_SOURCES})

target_include_directories(rne_under_test PUBLIC
  "${CPP_DIR}"
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
  target_link_libraries(rne_under_test PUBLIC ${OpenCV_LIBS})
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
  target_link_libraries(${suite_name} PRIVATE rne_test_support gtest_main ${ET_RE2_LIBS} ${ET_ABSEIL_LIBS} ${ET_JSON_LIBS})
  gtest_discover_tests(${suite_name} DISCOVERY_TIMEOUT 60)
endforeach()
