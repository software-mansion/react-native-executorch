# General Overview

## Minor version release

The release process of new minor version consists of the following steps:

1. Update version tags in `packages/react-native-executorch/src/constants/modelUrls.ts` to point to the proper `MINOR` version and update tags on [🤗 huggingface](https://huggingface.co/software-mansion).
2. Commit with a message 'Release v{MAJOR}.{MINOR}.0'.
3. Create a new release branch `release/{MAJOR}.{MINOR}` and push it to the remote.
4. Stability tests are performed on the release branch and all fixes to the new-found issues are pushed into the main branch and cherry-picked into the release branch. This allows for further development on the main branch without interfering with the release process.
5. Once all tests are passed, tag the release branch with proper version tag `v{MAJOR}.{MINOR}.0` and run the [npm publish workflow](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish.yml).
6. Create the release notes on GitHub.
7. Bump version in `package.json` on the `main` branch to `v{MAJOR}.{NEXT_MINOR}.0` and commit with a message 'Bump version to v{MAJOR}.{NEXT_MINOR}.0'.
8. Create versioned docs by running from repo root `(cd docs && yarn docs:version {MAJOR}.{MINOR}.x)` (the 'x' part is intentional and is not to be substituted). Also, make sure that all the links in `api-reference` are not broken.
9. Create a PR with the updated docs.
10. Update README.md with release video, if available.
11. Update README.md links to release branch.

## Patch release

After the release branch is created and the version is published to npm we only allow for bug fixes and other critical changes to be included into the release branch. For this purpose we use git `cherry-pick` command.

> [!CAUTION]
> Those changes should NOT include documentation changes, as they would be released automatically on the PR's merge and before the code changes are live. Instead create a separate PR with doc changes according to the [Docs update](#docs-update) section.

1. Create a PR with the fix to the `main` branch.
2. Once the PR is merged, create a new branch off `release/{MAJOR}.{MINOR}`, cherry-pick the relevant commits from `main`, and open a PR targeting `release/{MAJOR}.{MINOR}`.
3. Once the PR is merged, bump version in `package.json` to the new version `v{MAJOR}.{MINOR}.{REVISION}`.
   Commit with a message 'Release v{MAJOR}.{MINOR}.{REVISION}'.
4. Tag release branch with proper version tag `v{MAJOR}.{MINOR}.{REVISION}` and run the [npm publish workflow](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish.yml).
5. Create release notes on GitHub.

## Docs update

We are using docusaurus with docs versioning. By default when merging PRs with docs changes to the main branch, a GitHub workflow is started to publish the docs. For this reason those changes should be merged only once the related changes are released.
When updating docs the following steps should be considered.

1. Update the desired doc pages.
2. Check if the changes are applicable to past versions, if so make the same updates to the correct files in versioned docs inside `react-native-executorch/docs/versioned_docs/version-{MAJOR}.{MINOR}.x`.
3. Create a PR to the main branch.
