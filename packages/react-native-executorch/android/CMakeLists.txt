cmake_minimum_required(VERSION 3.10)
project(RnExecutorch)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

set(EXEC_LIB_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../third-party/android/jniLibs/${ANDROID_ABI}/libexecutorch.so")
set(OPENCV_LIB_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../third-party/android/jniLibs/${ANDROID_ABI}/libopencv_java4.so")

add_library(executorch SHARED IMPORTED)
set_target_properties(executorch PROPERTIES IMPORTED_LOCATION ${EXEC_LIB_PATH})

add_library(opencv SHARED IMPORTED)
set_target_properties(opencv PROPERTIES IMPORTED_LOCATION ${OPENCV_LIB_PATH})

find_package(ReactAndroid REQUIRED CONFIG)

file(GLOB CORE_SOURCES ../cpp/core/*.cpp)
file(GLOB MATH_SOURCES ../cpp/extensions/math/*.cpp)
file(GLOB CV_SOURCES ../cpp/extensions/cv/*.cpp)
file(GLOB NLP_SOURCES ../cpp/extensions/nlp/*.cpp)

add_library(${CMAKE_PROJECT_NAME} SHARED
    ../cpp/RnExecutorch.cpp
    ${CORE_SOURCES}
    ${CV_SOURCES}
    ${MATH_SOURCES}
    ${NLP_SOURCES}
    cpp-adapter.cpp
)

target_compile_definitions(${CMAKE_PROJECT_NAME} PRIVATE
    C10_USING_CUSTOM_GENERATED_MACROS=1
    EXECUTORCH_ENABLE_EXECUTION_PROFILING=1
)

target_include_directories(${CMAKE_PROJECT_NAME} PRIVATE
    ../cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/../third-party/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../third-party/include/executorch/extension/llm/tokenizers/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../third-party/include/executorch/extension/llm/tokenizers/third-party/json/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../third-party/include/executorch/extension/llm/tokenizers/third-party/re2
    ${CMAKE_CURRENT_SOURCE_DIR}/../third-party/include/executorch/extension/llm/tokenizers/third-party/abseil-cpp
)

# Ensure executorch is linked with WHOLE_ARCHIVE so all static initializers are included
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -Wl,--whole-archive)
target_link_libraries(${CMAKE_PROJECT_NAME} executorch)
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -Wl,--no-whole-archive)

target_link_libraries(${CMAKE_PROJECT_NAME}
    ReactAndroid::jsi
    log
    opencv
)
