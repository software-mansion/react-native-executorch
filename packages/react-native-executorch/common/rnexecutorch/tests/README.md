## Native Test
This guide provide information on how functions are tested, how to install all needed dependencies and how to run tests.

### Used Tools
To test the native code we use [`googletest`](https://github.com/google/googletest). It is a flexible tool for creating unit tests.

### Installation
The googletest is already in repo in `packages/react-native-executorch/third-party/googletest`. Firstly, you need to fetch googletest locally using:
* `git submodule init`
* `git submodule update --remote`

To build googletest navigate to its directory and type the following:
* `mkdir build && cd build`
* `cmake ..`
* `make`

### Usage
To run tests navigate to `packages/react-native-executorch` and type:
* `mkdir build && cd build`
* `cmake ..`
* `make`
* `ctest --verbose`

### How to a add new test
To add new test you need to:
* Place `*.cpp` file with tests using googletest in this directory.
* In `CMakeLists.txt`, one level higher in directory hierarchy, add all executables and link them with googletest, e.g.:
    ```
    set(SOURCE_FILES data_processing/Numerical.cpp)
    add_executable(NumericalTests tests/NumericalTest.cpp ${SOURCE_FILES})
    target_link_libraries(NumericalTests gtest gtest_main)
    ```
and add test execution, e.g.:
    ```
    add_test(NAME NumericalTests COMMAND NumericalTests)
    ```