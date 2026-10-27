# Type Alias: ParamSpec\<Dim\>

> **ParamSpec**\<`Dim`\> = [`TensorSpec`](TensorSpec.md)\<`Dim`\> \| \{ `kind`: `Exclude`\<[`ExecuTorchTag`](ExecuTorchTag.md), `"Tensor"`\>; \}

Defined in: [core/schema.ts:142](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L142)

Spec of a single input or output parameter of a method — either a
[TensorSpec](TensorSpec.md) or a primitive ExecuTorch value tag (`Int`, `Bool`, ...).

## Type Parameters

### Dim

`Dim` _extends_ [`SymbolicDim`](SymbolicDim.md)
