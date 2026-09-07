---
name: add-api-tests
description: Use when adding or changing anything under src/ — a task pipeline, a hook, a native op wrapper, a registry entry — and you need to cover it with the TypeScript API test suites.
metadata:
  id: add_api_tests
  scope: packages/react-native-executorch/__tests__/*
---

# Skill: Add TypeScript API Tests

Every change under `src/` belongs in the Jest suites at
[`packages/react-native-executorch/__tests__/`](../../../packages/react-native-executorch/__tests__/README.md).
They run on a laptop or a CI runner — no simulator, no device, no `.pte` — and
finish in a few seconds.

```bash
yarn workspace react-native-executorch test
yarn workspace react-native-executorch test __tests__/tasks   # one directory
yarn workspace react-native-executorch test -u                # update snapshots
```

Types come along for free: `yarn typecheck` already covers `__tests__/`.

---

## 🧩 The Fake Native Runtime

There is no stubbing of individual JSI calls. `__tests__/support/fakeJsi.ts`
implements the whole `__rnexecutorch_jsi__` contract in JavaScript — tensors
hold real data, `math`/`cv`/`speech` operators compute real values — so a task
pipeline runs end to end and its own logic is what the assertions measure.

A test describes the model it wants, then drives the real pipeline:

```typescript
import { f32, method } from '../../src/core/schema';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';

fakeJsi.registerModel('/models/task.pte', {
  schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 3)])),
  execute: writesOutputs([1, 0, 2]),
});

const runner = tracked(await createMyTask({ modelPath: '/models/task.pte', modelOpts }));
expect(await runner.runTask(imageBuffer(8, 8))).toEqual(/* ... */);
```

Key helpers:

| Helper | Use |
| :--- | :--- |
| `fakeJsi.registerModel(path, program)` | Make `loadModel(path)` succeed with a given schema and `execute` |
| `fakeJsi.registerTokenizer(path, vocabulary)` | Same for `loadTokenizer` |
| `fakeJsi.registerLLMRunner(path, program)` | Same for `createLLMRunner`: a context window and the responses to generate, one per `generate` call |
| `fakePhonemizer.serve(text, phonemes)` | Script the native grapheme-to-phoneme converter |
| `fakeFs.write(path, contents)` | Put a file where a pipeline will read it (a charset, a `tokenizer_config.json`, a voice matrix) |
| `exported(spec)` | Reinterpret a spec built with `method`/`f32`/`i64` as an *exported* one (it verifies no symbolic dims are left) |
| `writesOutputs(...)`, `copiesInputToOutput()` | Ready-made `execute` implementations |
| `tracked(pipeline)` | Auto-dispose at the end of the test |
| `imageBuffer(w, h, format)` | A deterministic input image |
| `cachePathFor(url)` | Where the fetcher will download a URL, so a hook test can register its model up front |
| `fakeNet.serve(url, route)` | Script the server: status, body, `Range` support, and a `gate` to hold a download open |

---

## 🧠 What to Cover for a New Task Pipeline

1. **Schema acceptance** — one test per variant the pipeline declares
   (`batched`, `unbatched`, ...), asserting the factory resolves.
2. **Schema rejection** — a model that matches no variant, asserting the error
   names the mismatch (`Rank mismatch`, `inconsistent bindings`, ...). A caller
   should learn what is wrong from the message.
3. **Configuration mismatch** — e.g. a `labels` array that disagrees with the
   model's output dimension.
4. **Postprocessing** — the part that is yours: sorting, thresholding,
   suppression, colormaps, coordinate scaling. Choose fixture values that make
   the expected output obvious in the test.
5. **Options** — every default in `modelOpts`, and every per-call override.
6. **Disposal** — `dispose()` leaves `fakeJsi.liveTensors()` at 0 and
   `fakeJsi.liveModels()` empty, and repeated calls do not accumulate scratch
   tensors. The same has to hold when construction *fails*: allocate through a
   `createResourceScope()` and wrap the factory body in `try`/`catch` so a
   schema mismatch releases the model instead of stranding it. Add the factory
   to `__tests__/tasks/constructionFailure.test.ts`, which drives every one of
   them.
7. **Sync/async parity** — `runTaskWorklet(x)` equals `await runTask(x)`.

Only the *weights* are out of scope, not the pipeline that runs on them. Before
settling for schema-acceptance-and-disposal, check what is actually TypeScript:
a decode loop, a sliding window, a chunker, an argument check, a streaming
generator and a disposal path all run fine over a scripted `execute`. Reach for
the minimal treatment only when the assertion would be measuring the fixture.

For a new hook, add a case to `__tests__/hooks/`: not-ready before the download
lands, methods exposed after, errors surfaced through the shared `error` field,
and every native handle released on unmount.

---

## 🔒 Leak Checking

Native memory is not garbage collected, so the setup file asserts after **every
test** that nothing allocated through the fake was left undisposed. That gives
each pipeline suite disposal coverage for free.

- Wrap construction in `tracked()` — it disposes at the end of the test and
  stops a failing assertion from cascading into a second, misleading error.
- A test that deliberately leaks calls `allowNativeLeaks()` with a comment
  saying why.

---

## 📐 Source-Level Conventions

`__tests__/api/workletDirective.test.ts` parses `src/` with the TypeScript
compiler and enforces the conventions no type can express:

- every exported function that calls into `rnexecutorchJsi` starts with
  `'worklet';`
- no `async` function is marked as a worklet
- only `src/native/bridge.ts` names the `__rnexecutorch_jsi__` global
- `core/` never imports from `extensions/`, and `hooks/` never imports from
  `native/`

If you add a new native wrapper without the directive, that suite fails — add
the directive rather than the exception.

---

## 📋 Verification Checklist

When adding or changing code under `src/`, verify that:

- [ ] `yarn workspace react-native-executorch test` passes.
- [ ] A new task pipeline has a suite covering acceptance, rejection,
      postprocessing, options and disposal.
- [ ] A new hook has a lifecycle case in `__tests__/hooks/`.
- [ ] A new registry entry passes `__tests__/api/modelRegistry.test.ts` without
      the rules being loosened (https URL, pinned revision,
      `modelname_backend_precision.pte`, a folder naming that backend, and a
      `DEFAULT` that is one of the configs the group offers).
- [ ] A new error code is in `VALID_ERROR_CODES`, so `isRnExecuTorchError` does
      not reject the library's own error — `__tests__/core/error.test.ts` reads
      every code `src/` raises out of the source and checks it is listed.
- [ ] A new export is reflected in the `api/apiSurface` snapshot, and the change
      is intentional (a removal or rename is a breaking change).
- [ ] Any new fake behaviour in `__tests__/support/` is faithful where fidelity
      changes an assertion, and its simplifications are commented.
- [ ] A new `create<Task>` allocates through `createResourceScope()` and is
      listed in `__tests__/tasks/constructionFailure.test.ts`.
- [ ] No test was made to pass by calling `allowNativeLeaks()`. Nothing in the
      suite needs it today, so reach for it only when a leak is genuinely the
      point of the test, and say why.
