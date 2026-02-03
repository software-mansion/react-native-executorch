# Class: ObjectDetectionModule

Defined in: [packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L13)

Module for object detection tasks.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new ObjectDetectionModule**(): `ObjectDetectionModule`

#### Returns

`ObjectDetectionModule`

#### Inherited from

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`imageSource`, `detectionThreshold`): `Promise`\<[`Detection`](../interfaces/Detection.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts:46](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L46)

Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.
`detectionThreshold` can be supplied to alter the sensitivity of the detection.

#### Parameters

##### imageSource

`string`

The image source to be processed.

##### detectionThreshold

`number` = `0.7`

The threshold for detection sensitivity. Default is 0.7.

#### Returns

`Promise`\<[`Detection`](../interfaces/Detection.md)[]\>

An array of Detection objects representing detected items in the image.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

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

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

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

Defined in: [packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L21)

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
