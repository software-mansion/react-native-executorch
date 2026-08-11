---
name: error-handling
description: Use when throwing, catching, or classifying errors anywhere in the library (TypeScript, worklets, C++/JSI), or when adding a new error code.
metadata:
  id: error_handling
  scope: src/core/error.ts, cpp/core/error.*
---

# Skill: Error Handling

Every failure the library raises carries a machine-readable `code`. Consumers branch on
the code; the message is for humans and may be reworded in any release.

**Never make control flow depend on message text.** A regex over `e.message` is the exact
failure this design exists to prevent.

`src/core/error.ts` is the source of truth. `cpp/core/error.h` mirrors it **by hand**, the
same way the rest of the TS/JSI interface is mirrored (DType definitions, schema types, host object
interfaces). Nothing here is generated. If you add a code, add it in both files.

---

## 🚦 Throwing

One factory, usable everywhere including inside worklets:

```typescript
import { RnExecuTorchError } from '../../../core/error';

throw RnExecuTorchError('INVALID_ARGUMENT', `topk must be non-negative, got ${topk}`);
```

`RnExecuTorchError` is a function, not a class. Worklet runtimes are separate JavaScript
runtimes and a value thrown on one does not keep its class identity or prototype chain
when it travels to another, so a class would only survive some of the paths that throw.
The factory returns a plain `Error` with `name`, `code`, and optionally
`etRuntimeErrorCode` attached, which is exactly what crosses every boundary intact.

Write messages the way the rest of the codebase does: prefix with the function name and
include the offending values (`` `execute: Unknown method '${methodName}'` ``). The code
says what class of problem it is; the message says which values caused it.

---

## 🎣 Catching

`isRnExecuTorchError(err, code?)` narrows, and takes an optional code so you rarely need a
second comparison:

```typescript
import { isRnExecuTorchError } from '../core/error';

try {
  await classifier.classify(image);
} catch (e) {
  if (isRnExecuTorchError(e, 'RESOURCE_BUSY')) return; // a run is already in flight
  throw e;
}
```

It is duck-typed and marked `'worklet'`, so it works on both runtimes and on values that
crossed the JSI boundary.

---

## 🔢 The Code Set

```text
LOAD_FAILED  EXECUTION_FAILED  SCHEMA_MISMATCH  INVALID_ARGUMENT  INVALID_STATE
RESOURCE_DISPOSED  RESOURCE_BUSY  DOWNLOAD_FAILED  DOWNLOAD_ABORTED  UNKNOWN
```

The set is deliberately coarse. **A distinct code earns its place only when an app can
genuinely recover differently from it** (retry a download, wait for a busy resource,
re-create a disposed one). Everything else is a category that exists so crash reporters
can group failures, and the detail belongs in the message.

Concretely: do not add a code for a specific subsystem (a tokenizer failure is
`EXECUTION_FAILED` or `LOAD_FAILED`) or for a variant of "the caller got it wrong"
(`INVALID_ARGUMENT` already covers unsupported languages, bad ranges, and wrong types).
Subdividing non-recoverable failures buys nothing over the message.

Adding one means editing `VALID_ERROR_CODES` in `src/core/error.ts` **and** adding a single
line to `FOR_ALL_RNEXECUTORCH_ERROR_CODES` in `cpp/core/error.h`. That X-macro list expands
into the enum, the string mapping, and the factory functions at once, so the three cannot
drift apart.

---

## ⚙️ C++ / JSI

Two rules, both mandatory:

1. **Never throw `jsi::JSError` from library code.** Throw through a factory, which builds an
   `RnExecuTorchException`. `guarded` is the only place that turns an exception into a
   JavaScript value, so a code cannot be lost on the way out.
2. **Wrap every host function registration in `error::guarded(...)`.** Without it the code
   is lost, including on the synchronous worklet path that VisionCamera frame processors
   use, which has no `wrapAsync` fallback.

There is one factory per code, so a throw site names the code and nothing else:

```cpp
#include "core/error.h"

namespace rnexecutorch::extensions::<domain> {
namespace jsi = facebook::jsi;
// Required in extensions::*, where sibling lookup does not reach core.
// OMIT this alias inside rnexecutorch::core::*, where unqualified `error`
// already resolves to rnexecutorch::core::error (clang-tidy fails on a dead alias).
namespace error = rnexecutorch::core::error;

void install_customOp(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "customOp";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("customOp: Usage: customOp(src, dst, factor)");
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

The alias is the only preamble a file needs. Name `RnExecuTorchException` or
`RnExecuTorchErrorCode` directly **only** where you genuinely need the type: a `catch`
clause, or a helper that takes a code as a parameter (see `unwrap` in `cpp/core/model.cpp`).

Every factory takes an optional second argument, an `executorch::runtime::Error`, which
travels to JS as `etRuntimeErrorCode` for diagnostics: `error::ExecutionFailed(msg,
result.error())`. Pass it only when the failure really came out of the ExecuTorch runtime.
Unwrapping an ExecuTorch `Result` is done with a small file-local `unwrap` helper (see
`cpp/core/model.cpp`), not a shared utility.

`guard` deliberately lets an existing `jsi::JSError` pass through untouched, so an error
thrown by an app's own callback (for example inside `tensor.through(fn)`) is never
rewritten with our name and code.

**Placement warning:** put `#include "core/error.h"` and the namespace alias at file
scope, never inside an `#if defined(__ANDROID__)` / `#elif defined(__APPLE__)` branch. Code
inside a platform branch compiles on your machine and breaks on every other target, and a
macOS-only local syntax check will not catch it.

---

## 📱 Example Apps

Leave error handling in `apps/` alone. They are a testing ground, so failures should be
surfaced raw (`e.message`, `String(e)`) rather than translated into friendly copy. See
issue #1288 for the separate discussion about splitting user-facing examples out.

---

## 🚫 Avoid / Anti-Patterns

- **Do NOT branch on message text.** No `/disposed/i.test(msg)`, no `msg.includes(...)`.
  Use the code.
- **Do NOT throw bare `Error` or `jsi::JSError`** from library code.
- **Do NOT make `RnExecuTorchError` a class.** It has to survive worklet boundaries.
- **Do NOT add a code for a failure an app cannot recover from differently.** Enrich the
  message instead.
- **Do NOT mirror the TS codes with a code generator.** The C++ side is written by hand,
  like the rest of the TS/JSI interface. The X-macro inside `error.h` is not codegen: it
  keeps three C++ declarations of one list in step, it does not read the TypeScript.
- **Do NOT leave a stale `@throws`.** Doc comments naming `jsi::JSError`,
  `std::runtime_error`, or `std::invalid_argument` are wrong: nothing in the library throws
  those any more.

---

## 📋 Verification Checklist

When adding or changing error handling, verify that:

- [ ] Every new throw site uses `RnExecuTorchError('CODE', message)` (TS) or `error::Code(message)` (C++).
- [ ] No raw `jsi::JSError` / `std::runtime_error` / `std::invalid_argument` was introduced.
- [ ] Every new `createFromHostFunction` registration is wrapped in `error::guarded(...)`.
- [ ] The `namespace error = ...` alias is present in `extensions::*` and absent in `core::*`.
- [ ] `#include "core/error.h"` and the `namespace error = ...` alias sit at file scope, outside any preprocessor branch.
- [ ] `RnExecuTorchException` / `RnExecuTorchErrorCode` are named only in a `catch` clause or a helper taking a code, never at a throw site.
- [ ] Catch sites use `isRnExecuTorchError(e, 'CODE')` rather than matching on the message.
- [ ] Every `@throws` on a function you touched names the exception **and its code**
      (`@throws error::RnExecuTorchException with code InvalidArgument if ...` in C++,
      `@throws {RnExecuTorchError} With code \`INVALID_ARGUMENT\` if ...` in TypeScript).
- [ ] Any new code was justified by a distinct recovery path, and added to `src/core/error.ts` **and** `cpp/core/error.h` (enum + `errorCodeToString`).
- [ ] Error handling in `apps/` was left surfacing raw errors.
