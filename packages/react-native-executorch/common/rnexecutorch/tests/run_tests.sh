#!/bin/bash
set -e

# cleanup past artifacts
rm -rf build
mkdir build
cd build

# compile & run tests
cmake ..
make -j$(nproc)
ctest --output-on-failure

# cleanup build/
cd ..
rm -rf build
