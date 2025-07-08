## Native Test
This guide provide information on how functions are tested, how to install all needed dependencies and how to run tests.

### Used Tools
To test the native code we use [`googletest`](https://github.com/google/googletest). It is a flexible tool for creating unit tests.

### Installation
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