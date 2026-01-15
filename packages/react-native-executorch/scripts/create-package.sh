#!/bin/bash

yarn install --immutable

if [ $# -ge 1 ] && [ "$1" = "generate_nightly_version" ]; then
  VERSION=$(jq -r '.version' package.json)
  IFS='.' read -r MAJOR MINOR PATCH <<<"$VERSION"
  GIT_COMMIT=$(git rev-parse HEAD)
  DATE=$(date +%Y%m%d)
  NIGHTLY_UNIQUE_NAME="${GIT_COMMIT:0:7}-$DATE"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "3s/.*/  \"version\": \"$MAJOR.$MINOR.$PATCH-nightly-$NIGHTLY_UNIQUE_NAME\",/" package.json
  else
    sed -i "3s/.*/  \"version\": \"$MAJOR.$MINOR.$PATCH-nightly-$NIGHTLY_UNIQUE_NAME\",/" package.json
  fi
fi

yarn bob build

npm pack

if [ $# -ge 1 ] && [ "$1" = "generate_nightly_version" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "3s/.*/  \"version\": \"$MAJOR.$MINOR.$PATCH\",/" package.json
  else
    sed -i "3s/.*/  \"version\": \"$MAJOR.$MINOR.$PATCH\",/" package.json
  fi
fi

echo "Done!"
