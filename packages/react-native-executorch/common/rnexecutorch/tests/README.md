## Native Test
This guide provide information on how functions are tested, how to install all needed dependencies and how to run tests.

### Used Tools
To test the native code we use [`googletest`](https://github.com/google/googletest). It's a flexible tool for creating unit tests.

### Installation
<<<<<<< HEAD
The googletest is already in repo in `react-native-executorch/third-party/googletest`. Firstly, you need to fetch googletest locally, run from root directory of project:
* `git submodule update --init --recursive third-party/googletest`

### Build Test Files
To run tests navigate tests directory namely:
* `cd packages/react-native-executorch/common/rnexecutorch/tests` 
and then type:
* `mkdir build && cd build`
* `cmake ..`
* `make`

### Run Tests
To run tests use the following command in `packages/react-native-executorch/common/rnexecutorch/tests/build`:
* `ctest --verbose`

Every time you updated the source code, you need to recompile the test files using: `cmake .. && make`.

### How to add a new test
To add new test you need to:
* Place `*.cpp` file with tests using googletest in this directory.
* In `CMakeLists.txt`, add all executables and link them with googletest, e.g.:
    ```
    set(SOURCE_FILES ${CMAKE_SOURCE_DIR}/../data_processing/Numerical.cpp)
    add_executable(NumericalTests tests/NumericalTest.cpp ${SOURCE_FILES})
    target_link_libraries(NumericalTests gtest gtest_main)
    ```
* Add test execution, e.g.:
    ```
    add_test(NAME NumericalTests COMMAND NumericalTests)
    ```
=======
The googletest is already in repo in `packages/react-native-executorch/third-party/googletest`. To build google test navigate to its directory and type the following:
* `mkdir build && cd build`
* `cmake ..`
* `make`

### Usage
To run tests navigate to `packages/react-native-executorch` and type:
* `mkdir build && cd build`
* `cmake ..`
* `make`
* `ctest --verbose`
<<<<<<< HEAD
>>>>>>> 90369ea8 (Improve testing using CMakeLists.txt)
=======

### How to a add new test
To add new test you need to:
* Place `*.cpp` file with tests using googletest in this directory.
* In `CMakeLists.txt`, one level higher in directory hierarchy, add all executables and link them with google test, e.g.:
    ```
    set(SOURCE_FILES data_processing/Numerical.cpp)
    add_executable(NumericalTests tests/NumericalTest.cpp ${SOURCE_FILES})
    target_link_libraries(NumericalTests gtest gtest_main)
    ```
and add test execution, e.g.:
    ```
    add_test(NAME NumericalTests COMMAND NumericalTests)
    ```
>>>>>>> ccbf247f (Add more tests and clear implementation)
