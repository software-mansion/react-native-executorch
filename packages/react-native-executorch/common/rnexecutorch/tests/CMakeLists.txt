cmake_minimum_required(VERSION 3.13)
project(RNExecutorchTests)

# C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

# tests/                         <- CMAKE_SOURCE_DIR (this file's location)
# rnexecutorch/                  <- RNEXECUTORCH_DIR (parent of tests)
# common/                        <- COMMON_DIR
# react-native-executorch/       <- PACKAGE_ROOT
# <monorepo-root>/               <- MONOREPO_ROOT
# <monorepo-root>/third-party/   <- THIRD_PARTY_DIR

set(RNEXECUTORCH_DIR "${CMAKE_SOURCE_DIR}/..")
set(COMMON_DIR "${RNEXECUTORCH_DIR}/..")
set(PACKAGE_ROOT "${COMMON_DIR}/..")
set(MONOREPO_ROOT "${PACKAGE_ROOT}/../..")
set(THIRD_PARTY_DIR "${MONOREPO_ROOT}/third-party")

# GoogleTest
add_subdirectory(${THIRD_PARTY_DIR}/googletest ${PROJECT_BINARY_DIR}/googletest)

# Source files
set(SOURCE_FILES ${CMAKE_SOURCE_DIR}/../data_processing/Numerical.cpp
                 ${CMAKE_SOURCE_DIR}/../data_processing/FileUtils.h)
# Include directories
include_directories(${RNEXECUTORCH_DIR}/data_processing)
include_directories(${RNEXECUTORCH_DIR})
include_directories(${COMMON_DIR})
include_directories(${PACKAGE_ROOT}/third-party/include)


# Executables for the tests
add_executable(NumericalTests NumericalTest.cpp ${SOURCE_FILES})
add_executable(FileUtilsTests FileUtilsTest.cpp ${SOURCE_FILES})
add_executable(LogTests LogTest.cpp)

# Libraries linking
target_link_libraries(NumericalTests gtest gtest_main)
target_link_libraries(FileUtilsTests gtest gtest_main)
target_link_libraries(LogTests gtest gtest_main ${log-lib})


if(ANDROID)
  target_link_libraries(LogTests log)
  # Add support for 16kB page size so we can run it on a simulator
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-z,max-page-size=16384")
endif()

# Testing functionalities
enable_testing()
add_test(NAME NumericalTests COMMAND NumericalTests)
add_test(NAME FileUtilsTests COMMAND FileUtilsTests)
add_test(NAME LogTests COMMAND LogTests)
