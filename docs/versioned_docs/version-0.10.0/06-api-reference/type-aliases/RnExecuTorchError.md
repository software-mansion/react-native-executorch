# Type Alias: RnExecuTorchError\<C\>

> **RnExecuTorchError**\<`C`\> = `Error` & `object`

Defined in: [core/error.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/error.ts#L84)

An error raised by React Native ExecuTorch.

Represents a standard `Error` augmented with a machine-readable
[RnExecuTorchErrorCode](RnExecuTorchErrorCode.md) and an optional ExecuTorch C++ runtime code
(`etRuntimeErrorCode`).

When thrown, call as a factory function without `new` (safe across worklet
threads):

```typescript
throw RnExecuTorchError('INVALID_ARGUMENT', 'Shape dimensions must be positive');
```

## Type Declaration

### code

> **code**: `C`

### etRuntimeErrorCode?

> `optional` **etRuntimeErrorCode**: `number`

The raw `executorch::runtime::Error` value when the failure came out of the
ExecuTorch runtime, absent otherwise. Diagnostic only: upstream's code space
moves independently of ours.

### name

> **name**: `"RnExecuTorchError"`

## Type Parameters

### C

`C` _extends_ [`RnExecuTorchErrorCode`](RnExecuTorchErrorCode.md) = [`RnExecuTorchErrorCode`](RnExecuTorchErrorCode.md)

The specific code, narrowed by [isRnExecuTorchError](../functions/isRnExecuTorchError.md).
