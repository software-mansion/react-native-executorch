# Interface: ExecutorchModuleType

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/executorchModule.ts#L19)

Return type for the `useExecutorchModule` hook.
Manages the state and core execution methods for a general ExecuTorch model.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:38](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/executorchModule.ts#L38)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/executorchModule.ts#L23)

Contains the error object if the model failed to load, download, or encountered a runtime error.

***

### forward()

> **forward**: (`inputTensor`) => `Promise`\<[`TensorPtr`](TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:46](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/executorchModule.ts#L46)

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

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:33](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/executorchModule.ts#L33)

Indicates whether the model is currently processing a forward pass.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:28](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/executorchModule.ts#L28)

Indicates whether the ExecuTorch model binary has successfully loaded into memory and is ready for inference.
