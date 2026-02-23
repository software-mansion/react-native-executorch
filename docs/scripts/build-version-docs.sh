#!/bin/bash
VERSION=$1
SHA=$(git rev-parse HEAD)

if [ -z "$VERSION" ]; then
  echo "Usage: yarn docs:version <version>"
  exit 1
fi

yarn docusaurus docs:version $VERSION

find versioned_docs/version-$VERSION -type f \( -name "*.md" -o -name "*.mdx" \) \
  -exec sed -i "" "s|/blob/main/|/blob/$SHA/|g" {} +

yarn prettier

echo "Versioned $VERSION docs pinned to $SHA"