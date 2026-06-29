# General Overview

## Version tag conventions

Model URLs in `packages/react-native-executorch/src/constants/modelUrls.ts` are built from two constants in `versions.ts`:

- `VERSION_TAG` — the **in-development** version (`resolve/v${LIB_VERSION}`). On `main` it points at the upcoming release; HuggingFace files under this tag may not be published until release day.
- `PREVIOUS_VERSION_TAG` — the **latest published stable** release. Use for back-compat references that should follow the last shipped version.

Anything that must stay pinned to a specific older HuggingFace tag (e.g. deprecated aliases whose files were removed in a later release) should hardcode `resolve/v{MAJOR}.{MINOR}.0` directly in `modelUrls.ts` rather than reusing `PREVIOUS_VERSION_TAG`.

## Minor version release

The release process of new minor version consists of the following steps:

1. On `main`, confirm every model URL in `packages/react-native-executorch/src/constants/modelUrls.ts` that should ship in this release is already pointing at `VERSION_TAG` (the in-development tag) and that the matching files exist on [🤗 huggingface](https://huggingface.co/software-mansion) under the `v{MAJOR}.{MINOR}.0` tag.
2. Make sure `LIB_VERSION` in `packages/react-native-executorch/src/constants/versions.ts` is `{MAJOR}.{MINOR}.0` so `VERSION_TAG` resolves to `resolve/v{MAJOR}.{MINOR}.0`.
3. Ensure the `version` field of `package.json` is `{MAJOR}.{MINOR}.0` for the core package (`react-native-executorch`) and both adapter packages (`bare-resource-fetcher`, `expo-resource-fetcher`).
4. If any of the above required changes, commit them on `main` with the message 'Release v{MAJOR}.{MINOR}.0'.
5. Create a new release branch `release/{MAJOR}.{MINOR}` from `main` and push it to the remote.
6. Stability tests are performed on the release branch and all fixes to the new-found issues are pushed into the main branch and cherry-picked into the release branch. This allows for further development on the main branch without interfering with the release process.
7. Once all tests are passed, tag the release branch with proper version tag `v{MAJOR}.{MINOR}.0` and run the following publish workflows:
   - [npm publish (core)](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish.yml)
   - [npm publish satellite packages](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish-satellites.yml) — run once per satellite package, selecting it via the `package` input (`react-native-executorch-bare-resource-fetcher`, `react-native-executorch-expo-resource-fetcher`, `react-native-executorch-webrtc`)
8. Create the release notes on GitHub.
9. Bump `main` to the next development cycle in a single PR:
   - Bump `version` in `package.json` to `{MAJOR}.{NEXT_MINOR}.0` for the core package and both adapter packages.
   - Bump `LIB_VERSION` in `versions.ts` to `{MAJOR}.{NEXT_MINOR}.0` (this auto-bumps `VERSION_TAG`).
   - Bump `PREVIOUS_VERSION_TAG` in `versions.ts` to `resolve/v{MAJOR}.{MINOR}.0` (the version that was just published).
   - Commit with the message 'Bump version to v{MAJOR}.{NEXT_MINOR}.0'.
10. Create versioned docs by running from repo root `(cd docs && yarn docs:version {MAJOR}.{MINOR}.x)` (the 'x' part is intentional and is not to be substituted). Also, make sure that all the links in `api-reference` are not broken.
11. Create a PR with the updated docs.
12. Update README.md with release video, if available.
13. Update README.md links to release branch.

## Patch release

After the release branch is created and the version is published to npm we only allow for bug fixes and other critical changes to be included into the release branch. For this purpose we use git `cherry-pick` command.

> [!CAUTION]
> Those changes should NOT include documentation changes, as they would be released automatically on the PR's merge and before the code changes are live. Instead create a separate PR with doc changes according to the [Docs update](#docs-update) section.

1. Create a PR with the fix to the `main` branch.
2. Once the PR is merged, create a new branch off `release/{MAJOR}.{MINOR}`, cherry-pick the relevant commits from `main`, and open a PR targeting `release/{MAJOR}.{MINOR}`.
3. Once the PR is merged, bump version in `package.json` of the core package and any adapter packages that require a fix to the new version `v{MAJOR}.{MINOR}.{REVISION}`.
   Commit with a message 'Release v{MAJOR}.{MINOR}.{REVISION}'.
4. Tag release branch with proper version tag `v{MAJOR}.{MINOR}.{REVISION}` and run the relevant publish workflows:
   - [npm publish (core)](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish.yml)
   - [npm publish satellite packages](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish-satellites.yml) — run once per affected satellite package via the `package` input _(if applicable)_
5. Create release notes on GitHub.

## Docs update

We are using docusaurus with docs versioning. By default when merging PRs with docs changes to the main branch, a GitHub workflow is started to publish the docs. For this reason those changes should be merged only once the related changes are released.
When updating docs the following steps should be considered.

1. Update the desired doc pages.
2. Check if the changes are applicable to past versions, if so make the same updates to the correct files in versioned docs inside `react-native-executorch/docs/versioned_docs/version-{MAJOR}.{MINOR}.x`.
3. Create a PR to the main branch.
