---
title: Error Handling
slug: /core-and-advanced/error-handling
description: 'Every failure the library raises carries a machine-readable code. Branch on the code, narrow across worklet and JSI boundaries, and throw the same way in your own pipelines.'
keywords:
  [
    react native executorch,
    error handling,
    RnExecuTorchError,
    isRnExecuTorchError,
    error codes,
    RESOURCE_BUSY,
    worklets,
  ]
---

# Error Handling

Every failure the library raises is an
[`RnExecuTorchError`](../06-api-reference/type-aliases/RnExecuTorchError.md)
carrying a machine-readable `code`. Applications branch on that code — to retry a
download, wait for a busy resource, or report a bug. The message is for humans and
may be reworded in any release, so never branch on it.

## The shape of an error

An `RnExecuTorchError` is a standard `Error` with three additions:

- **`name`** — always `'RnExecuTorchError'`.
- **`code`** — an [`RnExecuTorchErrorCode`](../06-api-reference/type-aliases/RnExecuTorchErrorCode.md),
  the machine-readable classification you branch on.
- **`etRuntimeErrorCode`** — the raw ExecuTorch C++ runtime error value, present
  only when the failure came out of the native runtime. Diagnostic only.

## Catching and narrowing

Use [`isRnExecuTorchError`](../06-api-reference/functions/isRnExecuTorchError.md)
to narrow a caught value. It takes an optional code, so a single call both
confirms the error is ours and checks its classification:

```typescript
import { isRnExecuTorchError } from 'react-native-executorch';

try {
  await classifier.classify(image);
} catch (e) {
  if (isRnExecuTorchError(e, 'RESOURCE_BUSY')) return; // a run is already in flight
  throw e; // not one of ours — rethrow
}
```

The check is duck-typed rather than an `instanceof`, so it works on errors that
crossed a worklet runtime or the JSI boundary, where class identity is lost. It
also carries the `'worklet'` directive, so you can narrow inside worklets. See
[Worklets & Threading](./06-worklets-and-threading.md).

## The code set

The set is deliberately coarse. A distinct code exists only where an application
can genuinely respond to it differently; everything else is a category for
grouping failures, with the specifics in the message.

| Code                | Raised when                                                                                                                                                          | How to respond                                             |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| `RESOURCE_BUSY`     | A model or tensor is already in use on another thread.                                                                                                               | Wait and retry, or skip this frame.                        |
| `RESOURCE_DISPOSED` | An object was used after `dispose()`.                                                                                                                                | Re-create it, or fix the lifetime.                         |
| `INVALID_STATE`     | A stateful operation was started while an incompatible one is still running (e.g. synthesis already in progress).                                                    | Wait for the in-flight operation to finish.                |
| `DOWNLOAD_FAILED`   | A model download failed (network, empty response).                                                                                                                   | Retry the download.                                        |
| `DOWNLOAD_ABORTED`  | A download was cancelled via its abort signal.                                                                                                                       | Expected on cancellation — usually just stop, no error UI. |
| `INVALID_ARGUMENT`  | The caller passed something invalid: a bad shape, mismatched byte length, tensor aliasing, an unknown method, or tensors that violate a declared runtime constraint. | Fix the call.                                              |
| `SCHEMA_MISMATCH`   | A model's exported schema doesn't satisfy the spec a pipeline requires.                                                                                              | Use a compatible model, or correct the spec.               |
| `LOAD_FAILED`       | A `.pte` could not be opened, parsed, or initialized.                                                                                                                | Check the file and path; report.                           |
| `EXECUTION_FAILED`  | Inference failed (e.g. a backend isn't registered, or a broken export).                                                                                              | Report; not recoverable at runtime.                        |
| `UNKNOWN`           | An uncategorized or setup failure (e.g. the JSI binding isn't registered).                                                                                           | Report.                                                    |

The full list is also available at runtime as
[`VALID_ERROR_CODES`](../06-api-reference/variables/VALID_ERROR_CODES.md).

:::warning Never branch on the message
The message is written for humans and can change at any time. Branching on it —
`e.message.includes('disposed')`, a regex over the text — is exactly the fragility
the `code` field exists to prevent. Always use
[`isRnExecuTorchError(e, 'CODE')`](../06-api-reference/functions/isRnExecuTorchError.md).
:::

## Throwing errors in your own pipelines

If you build custom pipelines on the primitives, raise failures the same way, so
callers can narrow them with the same
[`isRnExecuTorchError`](../06-api-reference/functions/isRnExecuTorchError.md)
check. Use the
[`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md) factory —
call it without `new`, since it must survive worklet boundaries — reuse an existing
code, and put the specifics in the message:

```typescript
import { RnExecuTorchError } from 'react-native-executorch';

function classify(topk: number) {
  'worklet';
  if (topk < 0) {
    throw RnExecuTorchError('INVALID_ARGUMENT', `classify: topk must be non-negative, got ${topk}`);
  }
  // ...
}
```

## Where to go next

- [Models & Tensors](./02-models-and-tensors.md) — where `RESOURCE_BUSY`, `RESOURCE_DISPOSED`, and `INVALID_ARGUMENT` come from.
- [Schema Validation](./03-schema-validation.md) — the source of `SCHEMA_MISMATCH`.
- [Worklets & Threading](./06-worklets-and-threading.md) — why errors must survive runtime boundaries.

### API reference

- [`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md) (factory) · [`RnExecuTorchError`](../06-api-reference/type-aliases/RnExecuTorchError.md) (type) · [`isRnExecuTorchError()`](../06-api-reference/functions/isRnExecuTorchError.md)
- [`RnExecuTorchErrorCode`](../06-api-reference/type-aliases/RnExecuTorchErrorCode.md) · [`VALID_ERROR_CODES`](../06-api-reference/variables/VALID_ERROR_CODES.md)
