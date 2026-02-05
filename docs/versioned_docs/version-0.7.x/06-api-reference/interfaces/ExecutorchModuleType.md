# Interface: ExecutorchModuleType

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/executorchModule.ts#L22)

Return type for the `useExecutorchModule` hook.
Manages the state and core execution methods for a general ExecuTorch model.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/executorchModule.ts#L41)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:26](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/executorchModule.ts#L26)

Contains the error object if the model failed to load, download, or encountered a runtime error.

---

### forward()

> **forward**: (`inputTensor`) => `Promise`\<[`TensorPtr`](TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:49](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/executorchModule.ts#L49)

Executes the model's forward pass with the provided input tensors.

#### Parameters

##### inputTensor

[`TensorPtr`](TensorPtr.md)[]

An array of `TensorPtr` objects representing the input tensors required by the model.

#### Returns

`Promise`\<[`TensorPtr`](TensorPtr.md)[]\>

A Promise that resolves to an array of output `TensorPtr` objects resulting from the model's inference.

#### Throws

If the model is not loaded or is currently processing another request.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:36](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/executorchModule.ts#L36)

Indicates whether the model is currently processing a forward pass.

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:31](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/types/executorchModule.ts#L31)

Indicates whether the ExecuTorch model binary has successfully loaded into memory and is ready for inference.
