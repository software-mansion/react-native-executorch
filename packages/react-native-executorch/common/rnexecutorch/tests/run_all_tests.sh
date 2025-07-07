#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Loop through all .cpp files in that directory
for file in "$SCRIPT_DIR"/*.cpp
do
    if [ -f "$file" ]; then
        file_name=$(basename "$file")
        echo "Processing $file_name"
        "$SCRIPT_DIR"/run_test.sh "$file"
    fi
done
