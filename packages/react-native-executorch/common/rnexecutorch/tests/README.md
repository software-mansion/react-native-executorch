## Native Test
This guide provide information on how functions are tested, how to install all needed dependencies and how to run tests.

### Used Tools
To test the native code we use [`googletest`](https://github.com/google/googletest). It's a flexible tool for creating unit tests.

### Installation
The googletest is already in repo in `react-native-executorch/third-party/googletest`. Firstly, you need to fetch googletest locally, run from root directory of project:
* `git submodule update --init --recursive third-party/googletest`

### Running tests

#### Prerequisites

- **Android NDK**: The `ANDROID_NDK` environment variable must be set
- **wget**: Must be in your PATH
- **Android emulator**: Must be running before executing tests
- **Device requirements**:
  - 16GB disk storage (minimum)
  - 8GB RAM (minimum)

#### First-time setup

Before running tests, you need to build an app to generate required native libraries (`libfbjni.so` and `libc++_shared.so`). The test script automatically searches for these in the monorepo.

If the script reports missing libraries, build any example app:
```bash
cd apps/computer-vision/android
./gradlew assembleDebug
# or
./gradlew assembleRelease
```

#### Running the tests

Navigate to the tests directory:
```bash
cd packages/react-native-executorch/common/rnexecutorch/tests
```

Run the test script:
```bash
bash ./run_tests.sh
```

This script:
- Downloads all needed models
- Pushes executables, models, assets, and shared libraries via ADB to the running emulator
- Runs the pre-compiled test executables

#### Available flags

* `--refresh-models` - Forcefully downloads all the models. By default, models are not downloaded unless they are missing from the specified directory.
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

