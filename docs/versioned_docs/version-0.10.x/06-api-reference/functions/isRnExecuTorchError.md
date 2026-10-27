# Function: isRnExecuTorchError()

> **isRnExecuTorchError**\<`C`\>(`err`, `code?`): `err is RnExecuTorchError<C>`

Defined in: [core/error.ts:121](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/error.ts#L121)

Narrows an unknown caught value to an [RnExecuTorchError](RnExecuTorchError.md), optionally
requiring a specific code.

Duck-typed so it holds for errors that crossed a worklet or JSI boundary,
where class identity is gone.

## Type Parameters

### C

`C` _extends_ `"LOAD_FAILED"` \| `"EXECUTION_FAILED"` \| `"SCHEMA_MISMATCH"` \| `"INVALID_ARGUMENT"` \| `"INVALID_STATE"` \| `"RESOURCE_DISPOSED"` \| `"RESOURCE_BUSY"` \| `"DOWNLOAD_FAILED"` \| `"DOWNLOAD_ABORTED"` \| `"UNKNOWN"` = `"LOAD_FAILED"` \| `"EXECUTION_FAILED"` \| `"SCHEMA_MISMATCH"` \| `"INVALID_ARGUMENT"` \| `"INVALID_STATE"` \| `"RESOURCE_DISPOSED"` \| `"RESOURCE_BUSY"` \| `"DOWNLOAD_FAILED"` \| `"DOWNLOAD_ABORTED"` \| `"UNKNOWN"`

## Parameters

### err

`unknown`

The caught value.

### code?

`C`

When given, also requires the error to carry exactly this code.

## Returns

`err is RnExecuTorchError<C>`

Whether `err` is an `RnExecuTorchError` (of code `code`, if given).

## Example

```typescript
try {
  await classifier.classify(image);
} catch (e) {
  if (isRnExecuTorchError(e, 'RESOURCE_BUSY')) return; // a run is in flight
  throw e;
}
```
