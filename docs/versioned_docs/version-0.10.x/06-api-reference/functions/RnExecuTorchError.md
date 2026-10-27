# Function: RnExecuTorchError()

> **RnExecuTorchError**\<`C`\>(`code`, `message`, `etRuntimeErrorCode?`): [`RnExecuTorchError`](../type-aliases/RnExecuTorchError.md)\<`C`\>

Defined in: [core/error.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/error.ts#L84)

Creates an RnExecuTorchError carrying a machine-readable code.

## Type Parameters

### C

`C` _extends_ `"LOAD_FAILED"` \| `"EXECUTION_FAILED"` \| `"SCHEMA_MISMATCH"` \| `"INVALID_ARGUMENT"` \| `"INVALID_STATE"` \| `"RESOURCE_DISPOSED"` \| `"RESOURCE_BUSY"` \| `"DOWNLOAD_FAILED"` \| `"DOWNLOAD_ABORTED"` \| `"UNKNOWN"`

The specific error code.

## Parameters

### code

`C`

The classification to attach. See [RnExecuTorchErrorCode](../type-aliases/RnExecuTorchErrorCode.md).

### message

`string`

A human-readable description of the failure.

### etRuntimeErrorCode?

`number`

The raw ExecuTorch runtime error, when available.

## Returns

[`RnExecuTorchError`](../type-aliases/RnExecuTorchError.md)\<`C`\>

An `Error` carrying `code` and `name: 'RnExecuTorchError'`.

## See

[RnExecuTorchErrorCode](../type-aliases/RnExecuTorchErrorCode.md)

## Example

```typescript
throw RnExecuTorchError('INVALID_ARGUMENT', 'Shape dimensions must be positive');
```
