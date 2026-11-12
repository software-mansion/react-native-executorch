---
name: verify-and-build
description: Use when selecting verification for library changes, building TypeScript or C++, rebuilding native apps, or troubleshooting JSI and device runtime failures.
metadata:
  id: verify_and_build
  scope: packages/react-native-executorch, apps, docs
---

# Verification, builds and runtime debugging

Run root commands from the repository root and package commands from
`packages/react-native-executorch/`. Select checks for the behavior changed; do not run native builds
for prose edits. Report missing prerequisites and skipped suites separately from passed checks.

## Verification matrix

| Change                                 | Checks                                                                                | Limits and additional verification                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Contributor guidance or skills         | Prettier on changed Markdown; review local links and inspect examples against source  | Typecheck complete changed TS examples; review schematic snippets against source       |
| Library TypeScript behavior            | Package typecheck, relevant Jest suites and package build; lint changed code          | Broaden tests for shared APIs; fake JSI does not verify production C++ or model output |
| Public exports or model registry       | Package typecheck/build, API surface or model registry suites                         | Inspect export snapshot diffs; verify new models/backends on the relevant device       |
| C++/JSI                                | Native static checks and relevant host C++ suites; API tests for changed TS contracts | Rebuild affected platforms; host tests do not execute delegated inference              |
| Native build/configuration             | Affected platform build; installation/artifact checks where applicable                | Pods/Gradle and binary provisioning depend on what changed                             |
| Docs pages, generators or API comments | `yarn build` from `docs/`; inspect relevant generated output                          | Site checks do not prove code samples run on-device                                    |

For cross-workspace changes, use root `yarn typecheck` and relevant app checks. Repeat or broaden checks
when additional changes, failures or remaining uncertainty justify it.

## TypeScript checks

From the repository root:

```bash
yarn workspace react-native-executorch typecheck
yarn workspace react-native-executorch test
yarn workspace react-native-executorch prepare
```

The package typecheck includes `__tests__/`. Target suites by path for focused iteration, for example
`yarn workspace react-native-executorch test __tests__/tasks`. See
[API tests](../add-api-tests/SKILL.md) for fixtures, lifecycle and construction-failure assertions.

`prepare` runs `react-native-builder-bob` to produce JS and declaration outputs. Root `yarn prepare`
runs workspace preparation; root `yarn typecheck` runs preparation first and then checks workspace types.
Avoid running the same build again solely because it has a different entry command.

Root `yarn lint` runs workspace lint scripts; some app scripts use `--fix`, so inspect resulting changes.
For focused library linting, run ESLint on changed files from the package directory.

## C++ static checks

Run both checks for C++ changes when prerequisites are available. The warning checker may exit 0 after
skipping work: read its output rather than reporting that as a successful compilation.

### clang-tidy

From the repository root on macOS with Homebrew LLVM:

```bash
CLANG_TIDY=$(brew --prefix llvm)/bin/clang-tidy yarn workspace react-native-executorch lint:cpp
```

On other hosts, use `yarn workspace react-native-executorch lint:cpp` with compatible `clang-tidy` on
PATH, or set `CLANG_TIDY` to its executable. The Xcode toolchain does not supply the required checker.
Requires JSI and provisioned third-party headers. See
[third-party setup](../../../packages/react-native-executorch/third-party/README.md).

Local LLVM can report findings absent from CI. Compare a finding against unchanged base code before
expanding scope. Keep platform-independent includes and namespace aliases outside platform branches;
a macOS check cannot validate Android-only compilation.

### Compiler warnings

From the package directory, pass changed files explicitly, for example:

```bash
./scripts/check-cpp-warnings.sh cpp/core/tensor.cpp
```

For all production sources:

```bash
find cpp/ -path cpp/tests -prune -o \( -name '*.cpp' -o -name '*.h' \) -print | \
  xargs ./scripts/check-cpp-warnings.sh
```

The script has no file discovery and does nothing with no arguments. It skips when the compiler,
configuration or headers are missing. It uses `compile_flags.txt` and `.clangd`, not the mobile app's
entire platform build configuration.

## Host C++ tests

The [C++ test README](../../../packages/react-native-executorch/cpp/tests/README.md) owns dependency,
submodule and fixture provisioning. From the package directory after provisioning:

```bash
scripts/run-native-tests.sh
scripts/run-native-tests.sh -R MathOpsTest
```

These suites use Hermes and an ExecuTorch host build to test real JSI contracts. They require CMake,
Ninja, headers and pinned native dependencies. Optional OpenCV/phonemis support and downloaded fixtures
affect which suites run. Inspect CMake/CTest output and report disabled or omitted coverage. Provisioning
can take several minutes; do not repeatedly rebuild unchanged dependencies.

Host tests do not establish model execution with mobile delegates, LLM generation quality, or actual
phoneme output. Use device/emulator integration for those behaviors.

## Native app verification

The [consumer build matrix](../../../.github/consumer-builds/README.md) checks a
packed library in fresh bare RN and Expo applications on Android and iOS. It
runs Expo profiles on relevant PRs, including Windows-hosted Android and two
emulator/simulator runtime smoke cells. Manual dispatch can also select the full
bare RN/Worklets matrix.
Use it for publication, installation, autolinking, release bundling and
native build regressions. Only the smoke cells launch apps and verify a bundled
XNNPACK model; other backends and physical devices still need separate verification. The linked README owns its version pins, commands,
artifacts and limitations.

Choose the relevant app (`computer-vision`, `nlp` or `speech`) and inspect its current native setup.
Provision matching native libraries before rebuilding. If iOS native projects already exist, run
`pod install` in the app's `ios/` directory when dependencies, podspec files or source discovery change.
C++ source edits require recompilation, not necessarily pod reinstallation. Do not assume generated
`ios/` or `android/` directories exist in a fresh Expo checkout.

From the selected app directory:

```bash
yarn ios
# or
yarn android
```

The app scripts use Expo native build commands. iOS needs macOS/Xcode and CocoaPods; Android needs its
SDK/NDK and a suitable device/emulator. Clear build caches only when stale output explains a failure.
For changes shared by both platforms, verify both or record which remains unverified.

## JSI and worklet troubleshooting

- **JSI global not registered:** inspect
  [the bridge](../../../packages/react-native-executorch/src/native/bridge.ts) and native linkage;
  confirm the rebuilt app includes the module. Native installation is wired in
  [RnExecutorch.cpp](../../../packages/react-native-executorch/cpp/RnExecutorch.cpp).
- **Missing domain/operator:** compare the domain `install.cpp`, bridge wrapper and TypeScript exports.
  Adding an operator to an existing domain usually needs no new top-level domain registration.
- **Native crash or execution error:** collect Xcode console or Android logcat output and the model,
  platform, backend and input schema. Use coded failures as described in
  [error handling](../error-handling/SKILL.md).
- **Worklet logging:** log primitives or selected properties. Passing circular/native resource objects
  to the logger can freeze or fail across runtimes.

For Android logs:

```bash
adb logcat '*:S' ReactNative:V ReactNativeJS:V rnexecutorch:V
```

## Model downloads and registry changes

Inspect [the fetcher](../../../packages/react-native-executorch/src/fetcher/fetcher.ts) and
[useResourceDownload](../../../packages/react-native-executorch/src/hooks/useResourceDownload.ts)
before debugging downloads. The hook resolves URLs throughout a nested config, delegates to `download`,
and reports progress from 0 to 100. Storage uses `react-native-blob-util`: persistent document storage
on iOS and the configured Android storage path, not `RNFS.CachesDirectoryPath`.

Registry URL/revision/filename/default invariants are checked by the model registry API tests. Use
[core guidelines](../core-guidelines/SKILL.md) for registry ownership. Do not commit downloaded `.pte`
binaries; use pinned hosted assets or the existing checksum-verified test fixture mechanism.
