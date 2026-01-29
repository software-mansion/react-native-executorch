# Class: ImageSegmentationModule

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/ImageSegmentationModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L13)

Module for image segmentation tasks.

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

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

***

### forward()

> **forward**(`imageSource`, `classesOfInterest?`, `resize?`): `Promise`\<`Partial`\<`Record`\<[`DeeplabLabel`](../enumerations/DeeplabLabel.md), `number`[]\>\>\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/ImageSegmentationModule.ts:47](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L47)

Executes the model's forward pass

#### Parameters

##### imageSource

`string`

a fetchable resource or a Base64-encoded string.

##### classesOfInterest?

[`DeeplabLabel`](../enumerations/DeeplabLabel.md)[]

an optional list of DeeplabLabel used to indicate additional arrays of probabilities to output (see section "Running the model"). The default is an empty list.

##### resize?

`boolean`

an optional boolean to indicate whether the output should be resized to the original image dimensions, or left in the size of the model (see section "Running the model"). The default is `false`.

#### Returns

`Promise`\<`Partial`\<`Record`\<[`DeeplabLabel`](../enumerations/DeeplabLabel.md), `number`[]\>\>\>

A dictionary where keys are `DeeplabLabel` and values are arrays of probabilities for each pixel belonging to the corresponding class.

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

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

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

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

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/ImageSegmentationModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L22)

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
