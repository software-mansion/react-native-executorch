cmake_minimum_required(VERSION 3.10)
project(RnExecutorch)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

set(EXEC_LIB_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../third-party/android/jniLibs/${ANDROID_ABI}/libexecutorch.so")

add_library(executorch SHARED IMPORTED)
set_target_properties(executorch PROPERTIES IMPORTED_LOCATION ${EXEC_LIB_PATH})

find_package(ReactAndroid REQUIRED CONFIG)

file(GLOB CORE_SOURCES ../cpp/core/*.cpp)

add_library(${CMAKE_PROJECT_NAME} SHARED
    ../cpp/RnExecutorch.cpp
    ${CORE_SOURCES}
    cpp-adapter.cpp
)

target_compile_definitions(${CMAKE_PROJECT_NAME} PRIVATE
    C10_USING_CUSTOM_GENERATED_MACROS=1
    EXECUTORCH_ENABLE_EXECUTION_PROFILING=1
)

target_include_directories(${CMAKE_PROJECT_NAME} PRIVATE
    ../cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/../third-party/include
)

# Ensure executorch is linked with WHOLE_ARCHIVE so all static initializers are included
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -Wl,--whole-archive)
target_link_libraries(${CMAKE_PROJECT_NAME} executorch)
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -Wl,--no-whole-archive)

target_link_libraries(${CMAKE_PROJECT_NAME}
    ReactAndroid::jsi
    log
)
