# General Overview

## Minor version release

The release process of new minor version consists of the following steps:

1. When all tickets tracked in a release tracker (i.e. [#356](https://github.com/software-mansion/react-native-executorch/issues/356)) are merged into main branch, release branch named v{MAJOR}.{VERSION} is cut off from the main branch.
2. Stability tests are performed on the release branch and all fixes to the new-found issues are merged into the main branch and cherry-picked into the release branch.
3. Bump the version inside `package.json` in the root and commit to the release branch with commit message 'release: Bump version to v{MAJOR}.{MINOR}.0`.
4. Tag release branch with proper version tag (v{MAJOR}.{VERSION}.0) and run `npm publish`.
5. Create versioned docs by running from repo root `(cd docs && yarn docusaurus docs:version {MAJOR}.{MINOR}.x)`.
6. Create a PR with updated docs.
7. Ensure [jitpack](https://jitpack.io/#software-mansion/react-native-executorch) triggers build properly.
8. Create release notes on github.

## Patch release

After the release branch is created and the version is published to npm we only allow for bug fixes and other critical changes to be included into the release branch. For this purpose we use git `cherry-pick` command.

1. Create a PR to the main branch.
2. Once the PR is merged, `cherry-pick` the commit to the release branch.
3. Bump the version inside `package.json` in the root and commit to the release branch with commit message 'release: Bump version to v{MAJOR}.{MINOR}.{PATCH}`.
4. Tag release branch with proper version tag (v{MAJOR}.{VERSION}.{PATCH}) and run `npm publish`.
5. Ensure [jitpack](https://jitpack.io/#software-mansion/react-native-executorch) triggers build properly.
6. Create release notes on github.

## Docs update

We are using docusaurus with docs versioning. By default when merging PRs with docs changes to the main branch, a github workflow is started to publish the docs. When updating docs the following steps should be considered.

1. Update the desired doc pages.
2. Check if the changes are applicable to past versions, if so make the same updates to the correct files in versioned docs inside `react-native-executorch/docs/versioned_docs/version-{MAJOR}.{MINOR}.x`.
3. Create a PR to the main branch.
