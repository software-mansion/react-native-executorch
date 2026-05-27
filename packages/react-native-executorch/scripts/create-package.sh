#!/bin/bash

# Phonemis is a git submodule whose sources the podspec compiles directly
# (see third-party/common/phonemis/src in react-native-executorch.podspec).
# Init it explicitly so the files are present in the packed tarball.
# Run from repo root so the submodule path resolves regardless of cwd.
git -C "$(git rev-parse --show-toplevel)" submodule update --init --recursive \
  packages/react-native-executorch/third-party/common/phonemis

# Trim phonemis to what consumers need at build time. Done here (not via
# package.json "files") because the submodule's own .gitignore has
# `!scripts/build*` which npm-packlist honors and re-includes those files
# despite our exclusion rules. Restore on exit so the working tree stays clean.
PHONEMIS_DIR="third-party/common/phonemis"
restore_phonemis() {
  git -C "$PHONEMIS_DIR" checkout -- data test scripts requirements.txt 2>/dev/null || true
}
trap restore_phonemis EXIT
rm -rf "$PHONEMIS_DIR/data" "$PHONEMIS_DIR/test" "$PHONEMIS_DIR/scripts"
rm -f "$PHONEMIS_DIR/requirements.txt"

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
