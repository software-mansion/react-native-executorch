cmake_minimum_required(VERSION 3.10)
project(RNExecutorchTests)

# C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

find_library(log-lib log)

# googletest subdirectory
# Using an absolute path from the top-level source directory
add_subdirectory(${CMAKE_SOURCE_DIR}/../../../../../third-party/googletest ${PROJECT_BINARY_DIR}/googletest)

# Directories to include
include_directories(${CMAKE_SOURCE_DIR}/../data_processing)
include_directories(${CMAKE_SOURCE_DIR}/..)

# Source files
set(SOURCE_FILES ${CMAKE_SOURCE_DIR}/../data_processing/Numerical.cpp
                 ${CMAKE_SOURCE_DIR}/../data_processing/FileUtils.h)

# Executables for the tests
add_executable(NumericalTests NumericalTest.cpp ${SOURCE_FILES})
add_executable(FileUtilsTests FileUtilsTest.cpp ${SOURCE_FILES})
add_executable(LogTests LogTest.cpp)

# Libraries linking
target_link_libraries(NumericalTests gtest gtest_main)
target_link_libraries(FileUtilsTests gtest gtest_main)
target_link_libraries(LogTests gtest gtest_main ${log-lib})

# Testing functionalities
enable_testing()
add_test(NAME NumericalTests COMMAND NumericalTests)
add_test(NAME FileUtilsTests COMMAND FileUtilsTests)
add_test(NAME LogTests COMMAND LogTests)
