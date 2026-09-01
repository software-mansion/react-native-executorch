# TypeScript API tests

Jest suites covering the public TypeScript surface under `src/` — the hooks,
the task pipelines, the core primitives, the resource fetcher and the model
registry. They run on a developer machine or a CI runner: no simulator, no
emulator, no device, no `.pte` file, and the whole run finishes in a few
seconds.

```bash
yarn workspace react-native-executorch test
yarn workspace react-native-executorch test --watch
yarn workspace react-native-executorch test __tests__/tasks   # one directory
```

Types are checked by the existing `yarn typecheck`, which already covers this
directory.

## Why a fake native runtime, not stubs

Every path through `src/` bottoms out in `__rnexecutorch_jsi__`: a pipeline
allocates tensors, hands them to `model.execute`, and pushes them through
`softmax`, `resize` and `nms` on the way in and out. Stubbing those calls per
test would mean each assertion checks the stub rather than the pipeline — the
sorting in `classify`, the suppression in `detectObjects` and the colormap in
`segment` would all go untested.

So `support/fakeJsi.ts` implements the native contract in JavaScript instead:

| Piece | What it does |
| --- | --- |
| `support/fakeTensor.ts` | Typed-array-backed tensors with the real `setData`/`getData` byte semantics, `copyTo` windows, and use-after-dispose errors |
| `support/fakeOps.ts` | JS implementations of the `math`, `cv` and `speech` operators, plus the phonemizer host object |
| `support/fakeJsi.ts` | `createTensor`, `loadModel`, `loadTokenizer`, `createLLMRunner`, and the resource trackers |
| `support/blobUtilMock.ts` | In-memory filesystem plus a programmable server (status, body, `Range` support, `stateChange`, and a gate to hold a download open) |
| `support/workletsMock.ts` | Runs worklets inline — a worklet is an ordinary function marked for a second runtime |

A test describes the model it wants and drives the real pipeline over it:

```ts
fakeJsi.registerModel('/models/classifier.pte', {
  schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 3)])),
  execute: writesOutputs([1, 0, 2]),
});

const classifier = tracked(await createClassifier(config));
expect((await classifier.classify(imageBuffer(8, 8))).map((r) => r.label))
  .toEqual(['bird', 'cat', 'dog']);
```

The fake is faithful where fidelity changes an assertion — writing a float into
`uint8` storage rounds and clamps the way OpenCV's `saturate_cast` does, and the
tokenizer's methods are closures rather than prototype methods because a real
JSI host object's are — and deliberately simple elsewhere: `resize` is
nearest-neighbor whatever interpolation is asked for, and models the geometry
only. The numerical behavior of the real operators belongs to the C++ suites in
[`cpp/tests/`](../cpp/tests/README.md); what these suites own is the TypeScript
above them.

## Leak checking

Native memory is not garbage collected, so anything a test allocates through
the fake and does not dispose is a leak in the code under test. The setup file
asserts that after every test, so each pipeline suite gets disposal coverage
for free.

Wrap construction in `tracked()` and the harness disposes it at the end of the
test — which also keeps a failing assertion from cascading into a second,
misleading leak error. A test that means to leak calls `allowNativeLeaks()`.

## Layout

| Path | Contents |
| --- | --- |
| `core/` | `tensor`, `model`, `runtime`, the coded `error` type, and the `schema` spec matcher |
| `fetcher/` | `download` (caching, resume, cancellation, shared requests), telemetry, the Android backend, the optional background downloader |
| `tasks/` | One suite per task pipeline, plus the shared construction-failure behavior. `remainingTasks.ts` holds the pipelines that only get schema acceptance and disposal |
| `hooks/` | `useModel`, `useResourceDownload`, and the task hooks end to end |
| `extensions/` | The pure-TypeScript helpers: box/point scaling, seeded generators |
| `api/` | Export snapshot, model registry rules, label constants, source-level conventions |
| `support/` | The fake runtime, the mocks, and the fixtures |

## What is deliberately not covered

**Numerical behavior of the native operators.** `resize` interpolation,
`cvtColor` conversions and the exact `nms` arithmetic are the C++ suites' job;
duplicating them here would only test the fake.

**The weights.** Whisper's decode loop, the VAD rolling window and the SDXS
diffusion step depend on real model weights, so faking them would mostly assert
against the fixture. What they do get is schema acceptance, rejection of a
mismatched model, and full disposal — including Whisper's nested tokenizer and
VAD pipeline.

The line is drawn per pipeline rather than per suite, because it falls in a
different place for each. Kokoro's waveform is weights, but its chunking,
argument validation and streaming are not; the privacy filter's logits are
weights, but the BIOES decode and the sliding window over them are pure
TypeScript and are driven end to end; the LLM's generation belongs to the
native runner, but the chat session's history, KV cache bookkeeping and
tool-calling loop are covered against a scripted one; PaddleOCR's probability
map is weights, but the quad decode, CTC collapse and reading order run over a
map the test paints.

**The thread hop.** Worklets run inline here, so serialization onto a real
worklet runtime is not exercised. The `'worklet'` directive convention that
makes that hop possible *is* checked, by parsing `src/` in
`api/workletDirective.test.ts`.
