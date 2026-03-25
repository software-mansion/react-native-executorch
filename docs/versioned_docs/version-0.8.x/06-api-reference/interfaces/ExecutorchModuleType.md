# Interface: ExecutorchModuleType

Defined in: [types/executorchModule.ts:20](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/executorchModule.ts#L20)

Return type for the `useExecutorchModule` hook.
Manages the state and core execution methods for a general ExecuTorch model.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/executorchModule.ts:39](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/executorchModule.ts#L39)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/executorchModule.ts:24](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/executorchModule.ts#L24)

Contains the error object if the model failed to load, download, or encountered a runtime error.

***

### forward()

> **forward**: (`inputTensor`) => `Promise`\<[`TensorPtr`](TensorPtr.md)[]\>

Defined in: [types/executorchModule.ts:47](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/executorchModule.ts#L47)

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

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/executorchModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/executorchModule.ts#L34)

Indicates whether the model is currently processing a forward pass.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/executorchModule.ts:29](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/executorchModule.ts#L29)

Indicates whether the ExecuTorch model binary has successfully loaded into memory and is ready for inference.
