# Class: ExecutorchModule

Defined in: [modules/general/ExecutorchModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/general/ExecutorchModule.ts#L13)

General module for executing custom Executorch models.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new ExecutorchModule**(): `ExecutorchModule`

#### Returns

`ExecutorchModule`

#### Inherited from

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:39](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L39)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/general/ExecutorchModule.ts:48](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/general/ExecutorchModule.ts#L48)

Executes the model's forward pass, where input is an array of `TensorPtr` objects.
If the inference is successful, an array of tensor pointers is returned.

#### Parameters

##### inputTensor

[`TensorPtr`](../interfaces/TensorPtr.md)[]

Array of input tensor pointers.

#### Returns

`Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

An array of output tensor pointers.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L22)

Runs the model's forward method with the given input tensors.
It returns the output tensors that mimic the structure of output from ExecuTorch.

#### Parameters

##### inputTensor

[`TensorPtr`](../interfaces/TensorPtr.md)[]

Array of input tensors.

#### Returns

`Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Array of output tensors.

#### Inherited from

`BaseModule.forwardET`

---

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [modules/BaseModule.ts:32](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L32)

Gets the input shape for a given method and index.

#### Parameters

##### methodName

`string`

method name

##### index

`number`

index of the argument which shape is requested

#### Returns

`Promise`\<`number`[]\>

The input shape as an array of numbers.

#### Inherited from

`BaseModule.getInputShape`

---

### load()

> **load**(`modelSource`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [modules/general/ExecutorchModule.ts:20](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/general/ExecutorchModule.ts#L20)

Loads the model, where `modelSource` is a string, number, or object that specifies the location of the model binary.
Optionally accepts a download progress callback.

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

Source of the model to be loaded.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
