---
title: Error Handling
slug: /core-and-advanced/error-handling
description: 'Every error thrown by the library includes a machine-readable code. Use isRnExecuTorchError to safely narrow errors across worklet and JSI boundaries.'
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

All library errors are
[`RnExecuTorchError`](../06-api-reference/type-aliases/RnExecuTorchError.md)
instances carrying a machine-readable `code`. Application logic should branch on
this `code` (e.g. retrying downloads, handling busy hardware backends, or
showing user-facing alerts) rather than inspecting `error.message`.

## Error Structure

An `RnExecuTorchError` extends the standard JavaScript `Error` with three
properties:

- **`name`** — Always `'RnExecuTorchError'`.
- **`code`** — An
  [`RnExecuTorchErrorCode`](../06-api-reference/type-aliases/RnExecuTorchErrorCode.md)
  string enum identifying the failure type.
- **`etRuntimeErrorCode`** — The raw C++ ExecuTorch runtime code (`number`),
  present only if the error originated inside native inference. Useful for
  diagnostic logs.

## Catching and Narrowing Errors

JavaScript class prototypes (`instanceof`) break when values cross worklet
runtime threads or JSI boundaries. To handle this reliably, the library provides
the duck-typed
[`isRnExecuTorchError`](../06-api-reference/functions/isRnExecuTorchError.md)
helper.

Passing a target code as the second argument verifies both the error type and
the specific failure reason:

```typescript
import { isRnExecuTorchError } from 'react-native-executorch';

try {
  await classifier.classify(image);
} catch (error) {
  if (isRnExecuTorchError(error, 'RESOURCE_BUSY')) {
    // Inference is already running on another thread; skip or retry this frame
    return;
  }
  // Re-throw unexpected or external errors
  throw error;
}
```

Because `isRnExecuTorchError` includes the `'worklet'` directive, it works identically inside UI worklets, background runtimes, and the main React Native JS thread.

## Error Codes Reference

Error codes categorize actionable failure modes:

| Code                | Triggered By                                                                                                       | Recommended Action                                                        |
| :------------------ | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `RESOURCE_BUSY`     | A model or locked tensor is already executing on another thread.                                                   | Retry after delay or skip the current frame.                              |
| `RESOURCE_DISPOSED` | A model, tensor, or tokenizer was accessed after `.dispose()`.                                                     | Re-initialize the resource or fix its lifecycle.                          |
| `INVALID_STATE`     | An operation was triggered during an incompatible state (e.g. starting speech synthesis while already generating). | Wait for the active operation to complete or cancel it.                   |
| `DOWNLOAD_FAILED`   | Network failure or invalid response when downloading a `.pte` or tokenizer.                                        | Check connectivity and retry the download.                                |
| `DOWNLOAD_ABORTED`  | A download was intentionally cancelled via `AbortSignal`.                                                          | Clean up UI state without showing an error banner.                        |
| `INVALID_ARGUMENT`  | Invalid input shapes, mismatched byte sizes, aliased tensors in `execute()`, or unsupported options.               | Fix the input dimensions or parameters passed to the call.                |
| `SCHEMA_MISMATCH`   | A model's exported `.pte` schema does not satisfy the pipeline spec.                                               | Use a compatible model or update the spec requirements.                   |
| `LOAD_FAILED`       | Failed to read, parse, or allocate memory for a `.pte` file.                                                       | Check that the file exists and is a valid ExecuTorch binary.              |
| `EXECUTION_FAILED`  | Native kernel execution failed (e.g. missing delegate backend or unsupported operator).                            | Inspect `etRuntimeErrorCode`; ensure required native backends are linked. |
| `UNKNOWN`           | Uncategorized native runtime or JSI bridge failure.                                                                | Log error details and report if unexpected.                               |

The complete list of code strings is exported as [`VALID_ERROR_CODES`](../06-api-reference/variables/VALID_ERROR_CODES.md).

:::warning Do not parse error messages
Error messages are meant for human debugging and may change across releases. Always branch on `error.code` with `isRnExecuTorchError(error, 'CODE')`.
:::

## Throwing Errors in Custom Pipelines

When writing custom pipelines or task helpers, use the [`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md) factory function. Do **not** use `new RnExecuTorchError()`, as plain object factories can be safely passed across worklet boundaries:

```typescript
import { RnExecuTorchError } from 'react-native-executorch';

function classify(topk: number) {
  'worklet';
  if (topk <= 0) {
    throw RnExecuTorchError('INVALID_ARGUMENT', `topk must be greater than 0, got ${topk}`);
  }
  // ...
}
```

## Next Steps

- [Models & Tensors](./02-models-and-tensors.md) — How tensor locking and memory lifecycle trigger `RESOURCE_BUSY` and `RESOURCE_DISPOSED`.
- [Schema Validation](./03-schema-validation.md) — Pre-flight model schema validation to avoid `SCHEMA_MISMATCH`.
- [Worklets & Threading](./06-worklets-and-threading.md) — Error propagation across JS and worklet threads.

### API Reference

- [`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md) (factory) · [`RnExecuTorchError`](../06-api-reference/type-aliases/RnExecuTorchError.md) (type) · [`isRnExecuTorchError()`](../06-api-reference/functions/isRnExecuTorchError.md)
- [`RnExecuTorchErrorCode`](../06-api-reference/type-aliases/RnExecuTorchErrorCode.md) · [`VALID_ERROR_CODES`](../06-api-reference/variables/VALID_ERROR_CODES.md)
