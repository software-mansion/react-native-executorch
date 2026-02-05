# Class: TextToImageModule

Defined in: [packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts:14](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L14)

Module for text-to-image generation tasks.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new TextToImageModule**(`inferenceCallback?`): `TextToImageModule`

Defined in: [packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L22)

Creates a new instance of `TextToImageModule` with optional callback on inference step.

#### Parameters

##### inferenceCallback?

(`stepIdx`) => `void`

Optional callback function that receives the current step index during inference.

#### Returns

`TextToImageModule`

#### Overrides

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`input`, `imageSize`, `numSteps`, `seed?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts:100](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L100)

Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps.
The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string.

#### Parameters

##### input

`string`

The text prompt to generate the image from.

##### imageSize

`number` = `512`

The desired width and height of the output image in pixels.

##### numSteps

`number` = `5`

The number of inference steps to perform.

##### seed?

`number`

An optional seed for random number generation to ensure reproducibility.

#### Returns

`Promise`\<`string`\>

A Base64-encoded string representing the generated PNG image.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

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

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

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

### interrupt()

> **interrupt**(): `void`

Defined in: [packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts:127](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L127)

Interrupts model generation. The model is stopped in the nearest step.

#### Returns

`void`

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts:35](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L35)

Loads the model from specified resources.

#### Parameters

##### model

Object containing sources for tokenizer, scheduler, encoder, unet, and decoder.

###### decoderSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### encoderSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### schedulerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### unetSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
