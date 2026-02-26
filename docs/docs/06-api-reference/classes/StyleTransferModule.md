# Class: StyleTransferModule

Defined in: [modules/computer_vision/StyleTransferModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/StyleTransferModule.ts#L12)

Module for style transfer tasks.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new StyleTransferModule**(): `StyleTransferModule`

#### Returns

`StyleTransferModule`

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

> **forward**(`imageSource`): `Promise`\<`string`\>

Defined in: [modules/computer_vision/StyleTransferModule.ts:48](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/StyleTransferModule.ts#L48)

Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.

#### Parameters

##### imageSource

`string`

The image source to be processed.

#### Returns

`Promise`\<`string`\>

The stylized image as a Base64-encoded string.

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

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [modules/computer_vision/StyleTransferModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/StyleTransferModule.ts#L19)

Loads the model, where `modelSource` is a string that specifies the location of the model binary.
To track the download progress, supply a callback function `onDownloadProgressCallback`.

#### Parameters

##### model

Object containing `modelSource`.

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
