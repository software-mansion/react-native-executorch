# Error Handling

All library errors are [`RnExecuTorchError`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RnExecuTorchError) instances carrying a machine-readable `code`. Application logic should branch on this `code` (e.g. retrying downloads, handling busy hardware backends, or showing user-facing alerts) rather than inspecting `error.message`.

## Error Structure[​](#error-structure "Direct link to Error Structure")

An `RnExecuTorchError` extends the standard JavaScript `Error` with three properties:

* **`name`** — Always `'RnExecuTorchError'`.
* **`code`** — An [`RnExecuTorchErrorCode`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RnExecuTorchErrorCode) string enum identifying the failure type.
* **`etRuntimeErrorCode`** — The raw C++ ExecuTorch runtime code (`number`), present only if the error originated inside native inference. Useful for diagnostic logs.

## Catching and Narrowing Errors[​](#catching-and-narrowing-errors "Direct link to Catching and Narrowing Errors")

JavaScript class prototypes (`instanceof`) break when values cross worklet runtime threads or JSI boundaries. To handle this reliably, the library provides the duck-typed [`isRnExecuTorchError`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/isRnExecuTorchError) helper.

Passing a target code as the second argument verifies both the error type and the specific failure reason:

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

## Error Codes Reference[​](#error-codes-reference "Direct link to Error Codes Reference")

Error codes categorize actionable failure modes:

| Code                | Triggered By                                                                                                       | Recommended Action                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
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

The complete list of code strings is exported as [`VALID_ERROR_CODES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/VALID_ERROR_CODES).

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Do not parse error messages

Error messages are meant for human debugging and may change across releases. Always branch on `error.code` with `isRnExecuTorchError(error, 'CODE')`.

## Throwing Errors in Custom Pipelines[​](#throwing-errors-in-custom-pipelines "Direct link to Throwing Errors in Custom Pipelines")

When writing custom pipelines or task helpers, call the [`RnExecuTorchError`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/RnExecuTorchError) factory function (without `new`). Because `RnExecuTorchError` is a worklet-compatible factory function rather than an ES6 class, it constructs a standard `Error` with `name`, `code`, and stack trace attached, which can be safely thrown and caught across worklet runtimes and JSI boundaries:

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

## Next Steps[​](#next-steps "Direct link to Next Steps")

* [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md) — How tensor locking and memory lifecycle trigger `RESOURCE_BUSY` and `RESOURCE_DISPOSED`.
* [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation.md) — Pre-flight model schema validation to avoid `SCHEMA_MISMATCH`.
* [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) — Error propagation across JS and worklet threads.

### API Reference[​](#api-reference "Direct link to API Reference")

* [`RnExecuTorchError`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/RnExecuTorchError) (factory) · [`RnExecuTorchError`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RnExecuTorchError) (type) · [`isRnExecuTorchError()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/isRnExecuTorchError)
* [`RnExecuTorchErrorCode`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RnExecuTorchErrorCode) · [`VALID_ERROR_CODES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/VALID_ERROR_CODES)
