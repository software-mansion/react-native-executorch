#!/bin/bash
set -euo pipefail

# Builds the core package and produces the .tgz the npm publish workflow
# uploads. Invoked as `./scripts/create-package.sh [generate_nightly_version]`
# from packages/react-native-executorch.

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

# Match the version line by pattern, not by line number: `nativeLibsVersion`
# sits next to it, so a positional edit rewrites the wrong field if either
# moves.
set_version() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' -E "s/^(  \"version\": \")[^\"]*(\",)$/\1$1\2/" package.json
  else
    sed -i -E "s/^(  \"version\": \")[^\"]*(\",)$/\1$1\2/" package.json
  fi
}

NIGHTLY=0
if [ $# -ge 1 ] && [ "$1" = "generate_nightly_version" ]; then
  NIGHTLY=1
  VERSION=$(jq -r '.version' package.json)
  GIT_COMMIT=$(git rev-parse HEAD)
  DATE=$(date +%Y%m%d)
  set_version "$VERSION-nightly-${GIT_COMMIT:0:7}-$DATE"
fi

# `prepare` builds both outputs the "files" list ships: lib/ via bob and the
# legacy entry points via tsc. `bob build` alone leaves legacy/ unbuilt.
yarn prepare

npm pack

# The workflow asserts no node_modules were packed by grepping build.log for
# `node_modules/`, but nothing ever wrote that file, so the check silently
# passed on a missing file. Write the packed file list into it so the assertion
# is real. It has to be the tarball listing rather than the pack output: npm
# pack runs the `prepare` lifecycle, and bob logs the path of the tsc binary it
# falls back to, which lives under node_modules and trips the grep on a package
# that is perfectly clean.
TARBALL=$(ls -t ./*.tgz | head -1)
tar -tzf "$TARBALL" > build.log

if [ "$NIGHTLY" = "1" ]; then
  set_version "$VERSION"
fi

echo "Done!"
