cmake_minimum_required(VERSION 3.10)
project(RNExecutorchTests)

# C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

# Include directories for your project
include_directories("${PROJECT_SOURCE_DIR}/../")
include_directories("${PROJECT_SOURCE_DIR}/../data_processing")

# Enable testing with GoogleTest
enable_testing()

# Include Google Test
add_subdirectory("${PROJECT_SOURCE_DIR}/../../../../../third-party/googletest" "${CMAKE_BINARY_DIR}/googletest")


# Include Google Test's headers
include_directories("${gtest_SOURCE_DIR}/include" "${gmock_SOURCE_DIR}/include")

# Gather all test source files
set(TEST_SOURCES
    # "${PROJECT_SOURCE_DIR}/ImageProcessingTest.cpp"
    "${PROJECT_SOURCE_DIR}/LogTest.cpp"
    "${PROJECT_SOURCE_DIR}/NumericalTest.cpp"
)

set(FILE_SOURCES
    # "${PROJECT_SOURCE_DIR}/../data_processing/ImageProcessing.cpp"
    "${PROJECT_SOURCE_DIR}/../data_processing/Numerical.cpp"
)

# Add test executable
add_executable(RNExecutorchTests "${PROJECT_SOURCE_DIR}/TestRunner.cpp" ${TEST_SOURCES} ${FILE_SOURCES})

# Libraries linking
target_link_libraries(RNExecutorchTests gtest gtest_main)

# Testing functionalities
add_test(NAME RNExecutorchTests COMMAND RNExecutorchTests)
