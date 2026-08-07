---
name: error-handling
description: Use when throwing, catching, or classifying errors anywhere in the library (TypeScript, worklets, C++/JSI), when adding a new error code, or when surfacing failures in the example apps.
metadata:
  id: error_handling
  scope: src/errors/*, cpp/core/error.*, scripts/errors.config.ts
---

# Skill: Error Handling

Every failure the library raises carries a machine-readable `code`. Consumers branch on
the code; the message is for humans and may be reworded in any release.

**Never make control flow depend on message text.** A regex over `e.message` is the exact
failure this design exists to prevent.

---

## 🚦 The Two Throw Forms

Which one you use depends on **where the code runs**, not on what went wrong.

| Where you are                                                      | Throw with                             |
| :----------------------------------------------------------------- | :------------------------------------- |
| Normal TypeScript (task setup, `create<Task>` body, hooks, schema) | `new RnExecutorchError(code, message)` |
| Inside a `'worklet';` function                                     | `rnExecutorchError(code, message)`     |
| C++                                                                | `throw CodedError(ErrorCode::X, msg)`  |

Worklet runtimes are separate JavaScript runtimes. A value thrown on one does not keep
its class identity, prototype chain, or stack when it travels to another, so
`rnExecutorchError()` returns a plain `Error` with the fields attached instead of a class
instance. `wrapAsync` rebuilds a real `RnExecutorchError` once the value is back on the
React Native runtime.

```typescript
import { RnExecutorchError, RnExecutorchErrorCode, rnExecutorchError } from '../../../errors';

export async function createMyTask(config: MyTaskModel) {
  // Runs on the RN runtime: the class is fine here.
  if (config.taskOpts.labels.length !== N) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.InvalidArgument,
      `Labels length (${config.taskOpts.labels.length}) must match model output dimension (${N}).`
    );
  }

  const runTaskWorklet = (input: ImageBuffer, options?: { topk?: number }) => {
    'worklet';
    // Inside a worklet: plain-data form only.
    if (options?.topk !== undefined && options.topk < 0) {
      throw rnExecutorchError(
        RnExecutorchErrorCode.InvalidArgument,
        `topk must be non-negative, got ${options.topk}`
      );
    }
    // ...
  };
}
```

Write messages the way the rest of the codebase does: prefix with the function name and
include the offending values (`` `execute: Unknown method '${methodName}'` ``). The code
says what class of problem it is; the message says which values caused it.

---

## 🎣 Catching

Prefer `isRnExecutorchError(e)` over `instanceof RnExecutorchError`. Both work for errors
from `async` APIs and hooks, but only the former also works inside worklets and for values
that crossed a JSI boundary, where class identity is gone.

```typescript
import { isRnExecutorchError, RnExecutorchErrorCode } from '../errors';

try {
  await classifier.classify(image);
} catch (e) {
  if (isRnExecutorchError(e) && e.code === RnExecutorchErrorCode.ResourceBusy) {
    return; // a run is already in flight, drop this attempt
  }
  throw e;
}
```

`toRnExecutorchError(e)` normalizes any caught value into a real `RnExecutorchError`. Call
it at the boundary where errors surface to application code (after a worklet result comes
back, or in a hook's `catch`). Values that already carry a code keep it; anything else
becomes `Internal` with the original preserved as `cause`.

Because codes are numeric and shared with the native side, **a `switch` on `e.code` must
always have a `default` branch.**

---

## 🔢 The Code Set

`scripts/errors.config.ts` is the single source of truth. `yarn codegen:errors` generates
`src/errors/codes.ts` and `cpp/core/error_codes.h` from it, and CI fails on drift.

| Code                  | Use for                                                             |
| :-------------------- | :------------------------------------------------------------------ |
| `Internal`            | Unclassified, plus third-party throwables reaching the boundary     |
| `InvalidArgument`     | An argument to a public API is out of range or malformed            |
| `InvalidState`        | Operation invalid in the current lifecycle state                    |
| `NotSupported`        | Feature, backend, platform, or language unavailable here            |
| `FileAccessFailed`    | Reading or writing a local file failed                              |
| `ModelLoadFailed`     | The `.pte` could not be loaded (carries `etCode`)                   |
| `ResourceDisposed`    | A model, tensor, or tokenizer was used after `dispose()`            |
| `ResourceBusy`        | A model, tensor, or tokenizer is already in use                     |
| `ModelSchemaMismatch` | The model's I/O does not match the contract the task requires       |
| `ExecutionFailed`     | The ExecuTorch runtime failed executing a method (carries `etCode`) |
| `TokenizerError`      | Tokenizer load, encode, or decode failure                           |
| `DownloadFailed`      | Network failure, HTTP error, or interrupted transfer                |
| `DownloadAborted`     | Cancelled through an `AbortSignal`                                  |

**Before adding a code, apply the test: would a caller plausibly write a different `catch`
branch for this than for every code already listed?** If not, it is a message, not a code.
Put the detail in the message instead. The set is deliberately small.

If you do add one:

- Append at the end of the relevant block. **Never renumber or reuse a value**, they are
  what crosses the JSI and worklet boundaries.
- Run `yarn codegen:errors` and commit both generated files.
- Do not mirror ExecuTorch runtime errors into this enum. They keep their own numbering
  and travel in the separate `etCode` field.

---

## ⚙️ C++ / JSI

Two rules, both mandatory:

1. **Throw `CodedError`, never a raw `jsi::JSError` / `std::runtime_error` /
   `std::invalid_argument`.** A native exception without a code reaches JavaScript
   carrying nothing and degrades to `Internal`.
2. **Wrap every host function registration in `error::guarded(...)`.** This is what turns
   a `CodedError` raised anywhere in the native stack into a JS `Error` carrying `code`.
   Without it the code is lost, including on the synchronous worklet path that
   VisionCamera frame processors use, which has no `wrapAsync` fallback.

```cpp
#include "core/error.h"

namespace rnexecutorch::extensions::<domain> {
namespace jsi = facebook::jsi;
// Required in extensions::*, where sibling lookup does not reach core.
// OMIT this alias inside rnexecutorch::core::*, where unqualified `error`
// already resolves to rnexecutorch::core::error (clang-tidy fails on a dead alias).
namespace error = rnexecutorch::core::error;
using rnexecutorch::core::error::CodedError;
using rnexecutorch::core::error::ErrorCode;

void install_customOp(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "customOp";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw CodedError(ErrorCode::InvalidArgument, "Usage: customOp(src, dst, factor)");
        }
        // ...
        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3,
                                                             error::guarded(fnBody)));
}
} // namespace
```

Other helpers in `cpp/core/error.h`:

- `error::unwrapEt(code, ctx, result)` unwraps an `executorch::runtime::Result`, attaching
  both your code and the underlying ExecuTorch error as `etCode`. Use it instead of
  hand-rolled `unwrap` templates.
- `error::throwJs(rt, code, msg)` throws a coded JS error directly when you already hold a
  `jsi::Runtime`.

`guard` deliberately lets an existing `jsi::JSError` pass through untouched, so an error
thrown by an app's own callback (for example inside `tensor.through(fn)`) is never
rewritten with our name and code.

**Placement warning:** put `#include "core/error.h"` and the `using` declarations at file
scope, never inside an `#if defined(__ANDROID__)` / `#elif defined(__APPLE__)` branch. Code
inside a platform branch compiles on your machine and breaks on every other target, and a
macOS-only local syntax check will not catch it.

---

## 📱 Example Apps

Apps must not format library errors inline. Each app has an `errors.ts` exporting
`describeError(e)`, `isBusyError(e)`, and `isDisposedError(e)`. Use them:

```typescript
import { describeError, isBusyError } from '../../errors';

try {
  const output = await classify(buffer);
} catch (e) {
  // Tapping again mid-run is normal, do not flash an error at the user.
  if (!isBusyError(e)) setError(describeError(e));
}
```

Add a new user-facing branch to `describeError` rather than re-deriving a message at the
call site, and keep the three copies in `apps/*/errors.ts` in sync.

---

## 🚫 Avoid / Anti-Patterns

- **Do NOT branch on message text.** No `/disposed/i.test(msg)`, no `msg.includes(...)`.
  Use the code.
- **Do NOT throw bare `Error` / `jsi::JSError`** from library code. Every throw site gets
  a code.
- **Do NOT construct `RnExecutorchError` inside a worklet.** Use `rnExecutorchError()`.
- **Do NOT add a code that no caller would branch on.** Enrich the message instead.
- **Do NOT hand-edit** `src/errors/codes.ts` or `cpp/core/error_codes.h`. They are
  generated; edit `scripts/errors.config.ts` and re-run the codegen.
- **Do NOT widen a hook's error type back to `Error`.** Hooks expose
  `RnExecutorchError | null` so consumers can reach `code` without casting.

---

## 📋 Verification Checklist

When adding or changing error handling, verify that:

- [ ] Every new throw site carries an `RnExecutorchErrorCode`.
- [ ] Throws inside `'worklet';` functions use `rnExecutorchError()`, not `new RnExecutorchError()`.
- [ ] C++ throws use `CodedError`, and no raw `jsi::JSError` / `std::runtime_error` / `std::invalid_argument` was introduced.
- [ ] Every new `createFromHostFunction` registration is wrapped in `error::guarded(...)`.
- [ ] The `namespace error = ...` alias is present in `extensions::*` and absent in `core::*`.
- [ ] `#include "core/error.h"` and its `using` declarations sit at file scope, outside any preprocessor branch.
- [ ] Catch sites use `isRnExecutorchError` (not `instanceof`) and any `switch` on `code` has a `default`.
- [ ] Any new code passed the "would a caller branch on this?" test, was appended without renumbering, and `yarn codegen:errors` was run and both generated files committed.
- [ ] Example apps route failures through `describeError` rather than formatting inline.
