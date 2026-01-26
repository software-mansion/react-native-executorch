## Native Test
This guide provide information on how functions are tested, how to install all needed dependencies and how to run tests.

### Used Tools
To test the native code we use [`googletest`](https://github.com/google/googletest). It's a flexible tool for creating unit tests.

### Installation
The googletest is already in repo in `react-native-executorch/third-party/googletest`. Firstly, you need to fetch googletest locally, run from root directory of project:
* `git submodule update --init --recursive third-party/googletest`

### Running tests
To run tests navigate to tests directory, namely:
* `cd packages/react-native-executorch/common/rnexecutorch/tests`
To run tests, you need to make sure your Android emulator is running. This is because we're cross-compiling the test executables for Android, so we can easily run the tests using prebuilt Android third-party libs. To run the tests, you need to run the following command:
* `bash ./run_tests.sh`
This script downloads all the needed models, pushes all the executables, models, assets, shared libs via ADB to a running emulator. Finally, it runs the pre-compiled executables.
Available flags:
* `--refresh-models` - Forcefully downloads all the models. By default, the models are not downloaded, unless they are not in the specified directory.
* `--skip-build` - Skips the cmake build step.

### How to add a new test
To add new test you need to:
* Add a new .cpp file to either integration/ or unit/, depending on the type of the test.
* In `CMakeLists.txt`, add all executables and link all the needed libraries against the executable, for example you can use the `add_rn_test`, which is a helper function that links core libs. Example:
    ```cmake
    # unit
    add_rn_test(BaseModelTests integration/BaseModelTest.cpp)

    # integration
    add_rn_test(ClassificationTests integration/ClassificationTest.cpp
        SOURCES
            ${RNEXECUTORCH_DIR}/models/classification/Classification.cpp
            ${IMAGE_UTILS_SOURCES}
        LIBS opencv_deps
    )
    ```
* Lastly, add the test executable name to the run_tests script along with all the needed URL and assets.

