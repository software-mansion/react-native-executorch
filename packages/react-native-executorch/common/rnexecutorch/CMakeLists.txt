# Set minimum required version and project information
cmake_minimum_required(VERSION 3.10)
project(RNExecutorch)

# C++ Standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

# Include directories where the header files are located
include_directories(${PROJECT_SOURCE_DIR}/data_processing)
include_directories(${PROJECT_SOURCE_DIR})

# Adding source files
set(SOURCE_FILES data_processing/Numerical.cpp)

add_executable(NumericalTests tests/NumericalTest.cpp ${SOURCE_FILES})
target_link_libraries(NumericalTests gtest gtest_main)

add_executable(LogTests tests/LogTest.cpp)
target_link_libraries(LogTests gtest gtest_main)

# Enable testing functionalities
enable_testing()
add_test(NAME NumericalTests COMMAND NumericalTests)
add_test(NAME LogTests COMMAND LogTests)