cmake_minimum_required(VERSION 3.13)
project(RnExecutorch)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})

string(APPEND CMAKE_CXX_FLAGS " -DRCT_NEW_ARCH_ENABLED")

set(ANDROID_CPP_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../common")
set(LIBS_DIR "${CMAKE_SOURCE_DIR}/../third-party/android/libs")
set(INCLUDE_DIR "${CMAKE_SOURCE_DIR}/../third-party/include")

# FIXME: Below u can see miserable attempts of trying to link tokenizers-cpp 
# directly into react-native-executorch instead of it being linked against ExecuTorch
# and then transitively to our library. Please go back to this when we bump ET runtime to the next version.  
# The problem with directly linking tokenizers-cpp using a submodule is that we get unresolved symbols for 
# some android logging libraries, which are referenced by sentencepiece.

# set(TOKENIZERS_CPP_DIR "${CMAKE_SOURCE_DIR}/../../../third-party/tokenizers-cpp")
# add_subdirectory("${TOKENIZERS_CPP_DIR}" tokenizers-cpp)

# # Link Android log library to sentencepiece targets
# if(TARGET sentencepiece-static)
#   target_link_libraries(sentencepiece-static INTERFACE log)
# endif()
# if(TARGET sentencepiece_train-static)
#   target_link_libraries(sentencepiece_train-static INTERFACE log)
# endif()

# # Link log library to sentencepiece executables
# foreach(exe spm_encode spm_decode spm_normalize spm_train spm_export_vocab)
#   if(TARGET ${exe})
#     target_link_libraries(${exe} log)
#   endif()
# endforeach()

add_subdirectory("${ANDROID_CPP_DIR}")