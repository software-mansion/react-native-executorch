## Native Test
This guide provide information on how functions are tested, how to install all needed dependencies and how to run tests.

### Used Tools
To test the native code we use [`googletest`](https://github.com/google/googletest). It is a flexible tool for creating unit tests.

### Installation
The easiest way to install `googletest` is following:
* Clone repo locally and checkout on newest release: 
  `git clone git@github.com:google/googletest.git && cd googletest && git switch --detach v1.17.0`
* Build library files:
  * `mkdir build && cd build`
  * `cmake ..`
  * `make`
* Add `/usr/local/include` and `/usr/local/lib` to your path if not already there.

### Usage
To run tests please use:
* `run_test.sh` if you want to run one specific test, e.g. `run_test.sh LogTest.cpp`.
* `run_all_tests.sh` if you want to run all tests in the `tests` directory.