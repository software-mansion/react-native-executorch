cmake_minimum_required(VERSION 3.10)
project(RNExecutorchTests)

# Set the C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

# Add googletest subdirectory
# Using an absolute path from the top-level source directory
add_subdirectory(${CMAKE_SOURCE_DIR}/../../../../../third-party/googletest ${PROJECT_BINARY_DIR}/googletest)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/../data_processing)
include_directories(${CMAKE_SOURCE_DIR}/..)

# Adding source files
set(SOURCE_FILES ${CMAKE_SOURCE_DIR}/../data_processing/Numerical.cpp)

# Add executables for the tests
add_executable(NumericalTests NumericalTest.cpp ${SOURCE_FILES})
add_executable(LogTests LogTest.cpp)

# Link libraries
target_link_libraries(NumericalTests gtest gtest_main)
target_link_libraries(LogTests gtest gtest_main)

# Enable testing functionalities
enable_testing()
add_test(NAME NumericalTests COMMAND NumericalTests)
add_test(NAME LogTests COMMAND LogTests)