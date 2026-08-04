# C++ unit tests

Host-side GoogleTest suites for the sources under `cpp/`. They run on a
developer machine or a CI runner — no simulator, emulator or device — and the
whole suite finishes in a couple of seconds.

## Why a real JS engine

Every entry point in `cpp/` is JSI-facing: `install_sigmoid(jsi::Runtime&,
jsi::Object&)` installs a host function whose body takes `jsi::Value*`
arguments, pulls tensors out of them via `tensor::fromJs`, and reports misuse by
throwing `jsi::JSError`. There is no pure-C++ layer underneath to test in
isolation.

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
handling and the exact error messages — all the things a stub would have hidden.

`ExecuTorch` is linked too, as a minimal host build: `cpp/core/tensor.cpp` calls
`executorch::extension::from_blob`, so tensors are backed by real ET storage
rather than a lookalike.

## Layout

| Path | Contents |
| --- | --- |
| `support/JsiTestEnv.*` | Fixture owning a Hermes runtime with the module installed, plus `eval*` helpers |
| `core/` | `dtype`, `conversions`, `tensor`, `schema` |
| `extensions/` | `math`, `speech`, and (behind OpenCV) `cv` ops |

One binary per suite, so a crash in one area cannot take the run down with it
and `ctest -R MathOpsTest` targets a single suite.

## Running them

Two one-time provisioning steps, then the runner:

```bash
# 1. ExecuTorch/OpenCV/tokenizer headers (shared with clang-tidy and clangd)
RNET_HEADERS_ONLY=1 node scripts/download-libs.js

# 2. Hermes + a minimal ExecuTorch host build (~2 min, cached afterwards)
scripts/build-native-test-deps.sh

# 3. Build and run
scripts/run-native-tests.sh
scripts/run-native-tests.sh -R MathOpsTest   # extra args go to ctest
```

Requires `cmake`, `ninja` and — for the `cv` suite — OpenCV
(`brew install opencv` / `apt-get install libopencv-dev`). Without OpenCV, run
with `RNE_TESTS_ENABLE_OPENCV=OFF` to skip that suite.

## Keeping the pins honest

`scripts/build-native-test-deps.sh` pins both dependencies:

- `HERMES_VERSION` should match `node_modules/react-native/sdks/.hermesversion`,
  so the tests run on the engine the apps run on.
- `EXECUTORCH_VERSION` should match the ExecuTorch release that
  `third-party/include` is vendored from. The tests compile against those
  vendored headers and link these host-built libraries, so a drift between the
  two shows up as a link error — noisy, but at least not silent.

## What is deliberately not covered here

Anything that needs a real `.pte` program:

- `cpp/core/model.cpp` (loading, execution, output copy-back)
- `schema::validateSpec`, `methodSpecFromMetadata`, `getUsedBackends` — all take
  an ExecuTorch `MethodMeta`, which only exists once a program is loaded

The JSON-parsing and runtime-constraint halves of `schema` *are* covered, since
they need no program. Testing the rest means shipping fixture `.pte` files and a
runtime that can execute them; that belongs in a device/emulator integration job
rather than this host suite, and is the natural next step.

`cpp/extensions/nlp/tokenizer.cpp` is compiled and linked here (so it cannot rot
undetected) but has no suite yet — it needs tokenizer fixture files.
