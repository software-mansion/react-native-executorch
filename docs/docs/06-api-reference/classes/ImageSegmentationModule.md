# Class: ImageSegmentationModule

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/ImageSegmentationModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L8)

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new ImageSegmentationModule**(): `ImageSegmentationModule`

#### Returns

`ImageSegmentationModule`

#### Inherited from

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

***

### forward()

> **forward**(`imageSource`, `classesOfInterest?`, `resize?`): `Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/ImageSegmentationModule.ts:26](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L26)

#### Parameters

##### imageSource

`string`

##### classesOfInterest?

[`DeeplabLabel`](../enumerations/DeeplabLabel.md)[]

##### resize?

`boolean`

#### Returns

`Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

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

***

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

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

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/ImageSegmentationModule.ts:9](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L9)

#### Parameters

##### model

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
