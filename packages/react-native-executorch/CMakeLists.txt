cmake_minimum_required(VERSION 3.10)

project(ReactNativeExecutorch)

add_subdirectory(./third-party/googletest ${PROJECT_BINARY_DIR}/googletest)

add_subdirectory(common/rnexecutorch)

enable_testing()