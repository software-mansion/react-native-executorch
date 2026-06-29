# CI workflows

Three GitHub Actions workflows run on every PR:

| Workflow | Jobs |
|---|---|
| [`ci.yml`](ci.yml) | `lint` (eslint + `check-ci-filter-coverage.ts` + typecheck) and `build-library` (`yarn workspaces ... prepare`). Skips markdown / docs-only changes via `paths-ignore`. |
| [`test-bare-rn.yml`](test-bare-rn.yml) | Jest smoke test for `apps/bare-rn` |
| [`build-apps.yml`](build-apps.yml) | Per-app build matrix — bundles + native builds for all 5 demo apps on Android + iOS |

All three workflows skip draft PRs via `if: github.event.pull_request.draft != true`. `build-apps.yml` and `test-bare-rn.yml` additionally short-circuit on forks (`github.repository == 'software-mansion/react-native-executorch'`) so the expensive native matrix doesn't run on contributor forks.

The rest of this README explains `build-apps.yml`, which is the expensive one and has the most moving parts.

## The per-app build matrix

A naive matrix runs ~20 min × 10 native cells × every push. Two layers cut that cost:

1. **Path filtering** narrows the matrix per push — only apps whose files actually changed enter the matrix.
2. **Content-hash cache markers** let cells that already passed for the current code skip the build entirely.

Both layers read the same filter file: [`scripts/build-app-filters.yml`](../../scripts/build-app-filters.yml).

```
push → detect-changes job → matrix of (app, platform) cells
        │                    │
        │                    └─ each cell: compute content hash → cache lookup → skip if marker exists
        │
        └─ git diff $before $head | matched against build-app-filters.yml
```

## Filter file: `scripts/build-app-filters.yml`

Single source of truth for "which files belong to which app". Uses YAML anchors so each path is named once and composed up:

```yaml
core-shared: &core-shared          # files every app depends on
  - packages/react-native-executorch/src/{common,constants,errors,native,types,utils}/**
  - "{package.json,yarn.lock}"
  # ...
android-shared: &android-shared    # Android-only shared
  - .github/actions/build-android-app/**
  - packages/react-native-executorch/android/**
cv-pkg: &cv-pkg                    # CV-specific TS modules + C++ models
  - packages/react-native-executorch/common/rnexecutorch/models/VisionModel.{cpp,h}
  - packages/react-native-executorch/common/rnexecutorch/models/{classification,...,vertical_ocr}/**
  - packages/react-native-executorch/src/{modules,hooks}/computer_vision/**
  # ...
computer-vision-app: &computer-vision-app
  - *core-shared
  - *expo-fetcher
  - *cv-pkg
  - apps/computer-vision/**
computer-vision-android: [*computer-vision-app, *android-shared]
computer-vision-ios:     [*computer-vision-app, *ios-shared]
```

The final `<app>-<platform>` entries are what the matrix consumes. Everything else is composition.

### When to update the filter file

| Change | Update |
|---|---|
| New file under `apps/<existing-app>/**` | Nothing — already covered by `<app>-app` |
| New model directory under `packages/react-native-executorch/common/rnexecutorch/models/<domain>/` | `<domain>-pkg` anchor (add the directory name into its brace-expansion list) |
| New TS module under `src/modules/<domain>/` or `src/hooks/<domain>/` | `<domain>-pkg` anchor |
| New file that affects every app (e.g. new utility under `src/common/`) | Usually already covered by `core-shared`'s `src/{common,constants,errors,native,types,utils}/**` |
| New iOS-only / Android-only source under `packages/react-native-executorch/ios/` or `/android/` | Already covered by `ios-shared` / `android-shared` (broad `**` globs) |
| New demo app under `apps/<new-app>/` | New `<new-app>-pkg` + `<new-app>-app` + `<new-app>-android` + `<new-app>-ios` anchors, plus the apps list in `build-apps.yml`'s `Compute matrices` step |

You don't have to remember this list. `scripts/check-ci-filter-coverage.ts` runs in `ci.yml`'s `lint` job and fails the PR if any file under `packages/react-native-executorch/` isn't matched by a filter — you'll get a list of orphans and which anchor to add them to.

If a file genuinely doesn't belong to any build (e.g. `tsconfig.doc.json`), add it to `ALLOWLIST` in that script instead.

## Push-incremental diff (instead of `dorny/paths-filter`)

`dorny/paths-filter@v3` silently ignores its `base:` input on `pull_request` events (you'll see `'base' input parameter is ignored when action is triggered by pull request event` in the log). It always uses GitHub's PR-files API, which returns the *cumulative* PR diff — so every push to a PR re-evaluates filters against the entire PR diff and pulls every app that has ever been touched into the matrix.

We replaced it with [`scripts/detect-changed-filters.ts`](../../scripts/detect-changed-filters.ts), which runs `git diff --name-only $base $head` and matches the result against `build-app-filters.yml` using picomatch. For `pull_request synchronize` events, `base` is `github.event.before` (the previous push SHA), so the diff is just what *this push* changed. For `opened` / `reopened` / `ready_for_review`, `github.event.before` isn't set and the script falls back to `pull_request.base.sha` (full PR diff — the right thing for those events).

## Cache markers

Even when a cell enters the matrix, [`compute-app-hash.ts`](../../scripts/compute-app-hash.ts) hashes every tracked file matched by that cell's filter (excluding `HASH_EXCLUDE`). The hash becomes a cache key: `build-<app>-<platform>-<hash>` (or `bundle-<platform>-<app>-<hash>` for the bundle job). If a marker with that key exists in the GitHub Actions cache, the cell exits before doing any real work.

Markers are tiny (~250 bytes each — they exist only as cache-presence proofs, no payload). They're saved at the end of every successful build and live under the per-PR ref (`refs/pull/N/merge`) plus `refs/heads/main` for main-branch builds.

### `HASH_EXCLUDE`

Editing a file in `core-shared` triggers every app's matrix cell, but most edits to those files don't actually change build behavior — workflow tweaks, filter-file edits, etc. The hash excludes a small allowlist of orchestration files so editing them re-runs the matrix but every cell still hits its existing marker:

```ts
// compute-app-hash.ts
const HASH_EXCLUDE = new Set([
  '.github/workflows/build-apps.yml',
  'scripts/build-app-filters.yml',
  'scripts/detect-changed-filters.ts',
]);
```

If you make a workflow edit that *does* change build behavior — pinning a new action version, changing a `with:` input on a composite, swapping `runs-on:`, editing `.github/actions/setup/` (Node version, install flags) — markers won't reflect it. Force-clear the relevant cache entries from **Actions → Caches** in the repo UI.

Edits inside the per-platform composite actions (`.github/actions/build-android-app/`, `.github/actions/build-ios-app/`) *do* invalidate markers automatically, because those paths are part of `android-shared` / `ios-shared` and contribute to the hash.

## Common scenarios

### "I pushed a one-line tweak to one app and CI fired everything"

It shouldn't — push-incremental diff narrows to just that app's filter. If it didn't, check:

- Did the tweak also touch a file in `core-shared`? `package.json`, `yarn.lock`, and anything under `packages/react-native-executorch/src/{common,constants,errors,native,types,utils}/` fan out to every app.
- Is this the first push to a fresh PR? `pull_request opened` uses the PR base for the diff, which is correct but means the *entire PR diff* matches filters on the first run. Subsequent `synchronize` pushes will narrow.

### "I edited build-apps.yml and now everything is rebuilding from scratch"

`build-apps.yml` is in `HASH_EXCLUDE`, so cells should fan out but hit cache. If they're rebuilding for real:

- Did you also change something else under `core-shared` in the same push? That would invalidate every hash.
- Did the markers get evicted? GitHub's cache quota is 10 GB per repo with LRU eviction. Markers themselves are tiny but the yarn `node_modules` cache (~550 MB × Linux + macOS) sits alongside them. Heavy churn on other branches can evict markers.

### "I want to force a full rebuild"

**Actions → Caches** in the repo UI. Filter by `build-` or `bundle-` prefix and delete the relevant entries. Next push will cache-miss and rebuild.

### "I added a new model directory and the lint job fails saying it's an orphan"

`scripts/check-ci-filter-coverage.ts` walks every tracked file under `packages/react-native-executorch/` and verifies it matches at least one filter. Fix by adding the new path to the right `<domain>-pkg` anchor in `scripts/build-app-filters.yml`. If the file genuinely doesn't belong to any build (it's a doc, a license, etc.), add it to `ALLOWLIST` in `check-ci-filter-coverage.ts`.

### "I'm working on a long-running branch and don't want CI on every push"

Open the PR in draft. All three workflows skip on `draft != true`. Marking the PR as ready_for_review fires the workflows fresh on the current HEAD.
