# C++ unit tests

Host-side GoogleTest suites for the sources under `cpp/`. They run on a
developer machine or a CI runner — no simulator, emulator or device — and the
whole suite finishes in a couple of seconds.

## Why a real JS engine

Every entry point in `cpp/` is JSI-facing: `install_sigmoid(jsi::Runtime&,
jsi::Object&)` installs a host function whose body takes `jsi::Value*`
arguments, pulls tensors out of them via `tensor::fromJs`, and reports misuse by
throwing a coded `RnExecuTorchException` that `error::guarded` turns into a
JavaScript `Error` carrying `name`, `code` and sometimes `etRuntimeErrorCode`.
There is no pure-C++ layer underneath to test in isolation.

Stubbing that boundary would mean reimplementing a JS runtime badly, and every
test would be asserting against the stub rather than the code. So the tests link
**Hermes** — the engine React Native actually ships — install the production
module into it under its real global name (`__rnexecutorch_jsi__`), and drive it
from JavaScript exactly the way `src/` does:

```cpp
auto result = evalNumberArray(R"(
    const t = __rnexecutorch_jsi__.createTensor([2, 2], 'float32');
    t.setData(new Float32Array([1.5, -2.5, 3.0, 4.25]));
    ...
)");
```

That covers the argument parsing, the HostObject plumbing, TypedArray/ArrayBuffer
handling and the exact error messages and codes — all the things a stub would
have hidden. Negative tests go through `isCodedError(evalThrowing(...), CODE,
substring)`, so a throw site that loses its code by raising a bare
`jsi::JSError`, or by escaping the guard, fails rather than passing on the
message alone.

`ExecuTorch` is linked too, as a minimal host build: `cpp/core/tensor.cpp` calls
`executorch::extension::from_blob`, so tensors are backed by real ET storage
rather than a lookalike.

## Layout

| Path | Contents |
| --- | --- |
| `support/JsiTestEnv.*` | Fixture owning a Hermes runtime with the module installed, plus `eval*` helpers and the `isCodedError` / `throwsCoded` assertions |
| `core/` | `dtype`, `error`, `conversions`, `tensor`, `schema`, `model`, `utils` |
| `extensions/` | `math`, `speech`, `nlp` (tokenizer), `llm`, and — behind OpenCV — `cv` and `ocr` ops; `phonemizer` behind phonemis |
| `fixtures/` | Downloaded `.pte` program and `tokenizer.json` (gitignored) |

One binary per suite, so a crash in one area cannot take the run down with it
and `ctest -R MathOpsTest` targets a single suite.

## Running them

Two one-time provisioning steps, then the runner:

```bash
# 1. ExecuTorch/OpenCV/tokenizer headers (shared with clang-tidy and clangd).
#    The release is resolved from `nativeLibsVersion` in package.json.
RNET_HEADERS_ONLY=1 node scripts/download-libs.js

# 2. The submodules the tests compile. phonemis' `data/` is Git LFS and nothing
#    here reads it, so the checkout skips it.
git submodule update --init --depth 1 ../../third-party/googletest
GIT_LFS_SKIP_SMUDGE=1 git submodule update --init --depth 1 third-party/common/phonemis

# 3. Hermes + a minimal ExecuTorch host build (several minutes, cached afterwards)
scripts/build-native-test-deps.sh

# 4. Build and run (also fetches the fixtures, see below)
scripts/run-native-tests.sh
scripts/run-native-tests.sh -R MathOpsTest   # extra args go to ctest
```

Requires `cmake`, `ninja` and — for the `cv` suite — OpenCV's core and imgproc
modules:

```bash
brew install opencv                                          # macOS
apt-get install libopencv-core-dev libopencv-imgproc-dev     # Debian/Ubuntu
```

Without OpenCV, run with `RNE_TESTS_ENABLE_OPENCV=OFF` to skip the `cv` and
`ocr` suites; without the phonemis submodule the phonemizer suite is dropped
with a CMake warning (or turn it off explicitly with
`-DRNE_TESTS_ENABLE_PHONEMIS=OFF`).

Note the deliberately narrow apt packages. `libopencv-dev` is a meta-package
that hard-depends on the viz and contrib modules, so it drags in VTK, OpenMPI
and ~220 packages — it took over 50 minutes on a throttled CI mirror. Since
`OpenCVConfig.cmake` ships only in that meta-package, the build prefers OpenCV's
CMake package when present and otherwise locates the two libraries directly.

## Keeping the pins honest

`scripts/build-native-test-deps.sh` pins both dependencies:

- `HERMES_VERSION` should match `node_modules/react-native/sdks/.hermesversion`,
  so the tests run on the engine the apps run on.
- `EXECUTORCH_VERSION` should match the ExecuTorch release that
  `third-party/include` is vendored from — the release tagged
  `v${nativeLibsVersion}-libs`, currently ExecuTorch 1.3.1. The tests compile
  against those vendored headers and link these host-built libraries, so a drift
  between the two shows up as a link error — noisy, but at least not silent.
- `TOKENIZERS_COMMIT` pins `software-mansion-labs/pytorch-tokenizers`, which the
  script swaps in for ExecuTorch's own tokenizers submodule. The shipped
  libraries are built from `software-mansion-labs/executorch@rne-split-build`,
  which does the same, and `third-party/include` carries that fork's headers
  (they add the WordPiece/Unigram models and the NFC normalizer upstream has
  not taken). This is the one drift that does *not* show up as a link error:
  upstream's `libtokenizers.a` links fine and then `HFTokenizer::load` reads a
  differently laid out object and segfaults inside `setup_pretokenizer`.

## The fixtures

`scripts/fetch-test-fixtures.sh` downloads two, both pinned to an exact Hugging
Face revision and checksum-verified. `run-native-tests.sh` fetches them
automatically; they land in `fixtures/` and are gitignored rather than committed.

- A **.pte program** — selfie-segmentation, ~486 KB, the smallest the org
  publishes. Anything reading ExecuTorch `MethodMeta` needs a real program.
- A **tokenizer.json** — Whisper tiny.en's, ~2.4 MB. A plain BPE vocabulary, so
  the nlp extension's encode/decode path runs for real.

The useful part is that this needs **no XNNPACK delegate**, even though the
fixture is XNNPACK-delegated. `ModelHostObject`'s constructor only calls
`Module::load()` and `Module::method_meta()`, and in ExecuTorch both parse the
program without initialising delegates — only `load_method()` resolves backends
(it fails with error 32, `NotFound`, in this build). So the entire load path is
testable on the host:

- `schema::methodSpecFromMetadata`, `validateSpec`, `getUsedBackends`
- `loadModel`, and the `path` / `schema` / `backends` JS surface

If a fixture is missing (offline, `RNE_SKIP_FIXTURES=1`), the suites that need
it are dropped from the build with a CMake warning rather than failing it.

## What is deliberately not covered here

**Model execution.** `model.cpp`'s `execute` path — running inference and
copying outputs back — needs the delegate the program was exported against, so a
host XNNPACK build. Argument validation ahead of it is covered; the rest belongs
in a device/emulator integration job, which remains the natural next step.

**LLM generation.** `cpp/extensions/llm` wraps ExecuTorch's LLM runner, so
creating one loads a real model and running it needs that model's delegate — the
same limit as `execute`. `createLLMRunner`'s argument contract and how each load
failure is classified are covered; generation is not.

**Phoneme output.** phonemis phonemizes through a lexicon with a neural
fallback, and both are files under the submodule's `data/`, which is Git LFS and
not fetched here. The phonemizer suite pins the JSI contract — construction,
argument checking, the lifecycle, error classification — while `phonemize()`
returns an empty string for want of a vocabulary. Actual phonemes belong with
the on-device tests that run against the shipped assets.
