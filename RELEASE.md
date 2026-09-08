# General Overview

## Version tag conventions

Model URLs in `packages/react-native-executorch/src/models.ts` are built from
`BASE_URL` plus one of two tag constants defined in the same file:

- `NEXT_VERSION_TAG` — the **in-development** tag (`resolve/v${MAJOR}.${NEXT_MINOR}.0`). Models
  whose files are new or re-exported for the upcoming release point here. The
  HuggingFace files under this tag may not exist until release day.
- `VERSION_TAG` — the **latest published stable** tag (`resolve/v${MAJOR}.${MINOR}.0`). Models
  whose files last changed in a shipped release stay here, so a release does not
  repoint URLs whose artifacts did not change.

Both are plain string literals; there is no `LIB_VERSION` to derive them from.

> [!CAUTION]
> These constants were renamed **and their meanings swapped** in v0.10. Before
> that they lived in `src/constants/modelUrls.ts` / `src/constants/versions.ts`,
> were derived from `LIB_VERSION`, and `VERSION_TAG` meant the *in-development*
> tag while `PREVIOUS_VERSION_TAG` meant the published one. Today `VERSION_TAG`
> is the **published** tag and `NEXT_VERSION_TAG` is the in-development one.
> Editing `VERSION_TAG` by analogy with the old docs repoints every already
> shipped model URL.

Anything that must stay pinned to a specific older HuggingFace tag (e.g.
deprecated aliases whose files were removed in a later release) should hardcode
`resolve/v{MAJOR}.{MINOR}.0` directly in `models.ts` rather than reusing
`VERSION_TAG`.

## HuggingFace artifacts

The library resolves models from HuggingFace by **tag**, so publishing a `.pte`
to a model repo's `main` changes nothing for users until the release tag moves
to the commit holding it. Model repos are tagged independently of npm; a repo
only needs a tag move if its files changed this cycle.

For every model repo whose files changed:

1. Confirm the new files are on `main` in the repo, and that their checksums
   match what was exported locally.
2. Move the `v{MAJOR}.{MINOR}.0` tag to that commit (delete and recreate it).
3. Read the tag back and confirm it resolves to the intended commit.

Model card `README.md` files are generated from the repo tree and its
`config.json` files; the standard and the generated/free section split are
documented in
[react-native-executorch-spec](https://huggingface.co/software-mansion/react-native-executorch-spec/blob/main/MODEL_CARD.md).

## Minor version release

The release process of new minor version consists of the following steps:

1. On `main`, confirm every model URL in `packages/react-native-executorch/src/models.ts` that should ship in this release points at `NEXT_VERSION_TAG`, and that the matching files exist on [🤗 huggingface](https://huggingface.co/software-mansion) under the `v{MAJOR}.{MINOR}.0` tag. See [HuggingFace artifacts](#huggingface-artifacts) for moving those tags.
2. Make sure `NEXT_VERSION_TAG` in `packages/react-native-executorch/src/models.ts` is `resolve/v{MAJOR}.{MINOR}.0`.
3. Ensure the `version` field of `package.json` is `{MAJOR}.{MINOR}.0` for all four published packages:
   - `packages/react-native-executorch` (core)
   - `packages/bare-resource-fetcher`
   - `packages/expo-resource-fetcher`
   - `packages/react-native-executorch-webrtc`

   The core publish workflow reads the version from
   `packages/react-native-executorch/package.json`, so a wrong value there is
   what gets published. The satellite workflow takes an explicit `version`
   input instead.

   The two fetcher adapters are still required at `{MAJOR}.{MINOR}.0`: the core
   package ships the pre-0.10 API as `react-native-executorch/legacy`, and that
   path throws at runtime unless the consumer passes an adapter from one of
   them. Only the new API has a built-in fetcher.
4. If any of the above required changes, commit them on `main` with the message 'Release v{MAJOR}.{MINOR}.0'.
5. Create a new release branch `release/{MAJOR}.{MINOR}` from `main` and push it to the remote.
6. Confirm the native artifacts release the package resolves at install time
   exists and is not a draft. `scripts/download-libs.js` downloads from the
   GitHub Release tagged `v${nativeLibsVersion}-libs`, with `nativeLibsVersion`
   pinned in the core `package.json`; if that release or any of its assets is
   missing, every consumer's `postinstall` fails.
7. Stability tests are performed on the release branch and all fixes to the new-found issues are pushed into the main branch and cherry-picked into the release branch. This allows for further development on the main branch without interfering with the release process.
8. Once all tests are passed, tag the release branch with proper version tag `v{MAJOR}.{MINOR}.0` and run the following publish workflows. Both take a `dry-run` input; a dry run builds and packs without publishing, which is worth doing first since a failed publish cannot be taken back:
   - [npm publish (core)](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish.yml)
   - [npm publish satellite packages](https://github.com/software-mansion/react-native-executorch/actions/workflows/npm-publish-satellites.yml) — run once per satellite package, selecting it via the `package` input (`react-native-executorch-bare-resource-fetcher`, `react-native-executorch-expo-resource-fetcher`, `react-native-executorch-webrtc`)
9. Create the release notes on GitHub.
10. Bump `main` to the next development cycle in a single PR:
   - Bump `version` in `package.json` to `{MAJOR}.{NEXT_MINOR}.0` for the core package and both adapter packages.
   - In `models.ts`, add `VERSION_TAG` back as `resolve/v{MAJOR}.{MINOR}.0` (the version just published) and set `NEXT_VERSION_TAG` to `resolve/v{MAJOR}.{NEXT_MINOR}.0`. `VERSION_TAG` is absent between releases: every model resolves through `NEXT_VERSION_TAG` by the time one ships, which leaves the constant with no reader, and `noUnusedLocals` rejects that.
   - Rewrite `${NEXT_VERSION_TAG}` to `${VERSION_TAG}` in every model URL that shipped this cycle. They cannot be left alone: the URLs name the constant, not the tag, so bumping `NEXT_VERSION_TAG` alone would silently repoint every model at a release that does not exist yet. Only a model re-exported next cycle moves back to `${NEXT_VERSION_TAG}`.
   - Bump `LIB_VERSION` in `packages/react-native-executorch/src/fetcher/telemetry.ts` to match. A unit test asserts it equals the package version, so a missed bump fails CI rather than mislabelling every download event for the release.
   - Commit with the message 'Bump version to v{MAJOR}.{NEXT_MINOR}.0'.
11. Create versioned docs by running from repo root `(cd docs && yarn docs:version {MAJOR}.{MINOR}.x)` (the 'x' part is intentional and is not to be substituted). Also, make sure that all the links in `api-reference` are not broken.
12. Create a PR with the updated docs.
13. Update README.md with release video, if available.
14. Update README.md links to release branch.

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
