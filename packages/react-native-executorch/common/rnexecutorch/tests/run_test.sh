#!/bin/bash

# Check if a file name is provided
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <cpp_file>"
  exit 1
fi

file_name="$1"

# Compile the file with specified libraries
g++ -std=c++20 -o test_executable "$file_name" -lgtest -lgtest_main -lpthread

# Execute the binary
./test_executable

# Remove the executable
rm -f test_executable
