# Class: TextToImageModule

Defined in: [modules/computer_vision/TextToImageModule.ts:15](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L15)

Module for text-to-image generation tasks.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new TextToImageModule**(`inferenceCallback?`): `TextToImageModule`

Defined in: [modules/computer_vision/TextToImageModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L23)

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

### generateFromFrame()

> **generateFromFrame**: (`frameData`, ...`args`) => `any`

Defined in: [modules/BaseModule.ts:56](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L56)

Process a camera frame directly for real-time inference.

This method is bound to a native JSI function after calling `load()`,
making it worklet-compatible and safe to call from VisionCamera's
frame processor thread.

**Performance characteristics:**

- **Zero-copy path**: When using `frame.getNativeBuffer()` from VisionCamera v5,
  frame data is accessed directly without copying (fastest, recommended).
- **Copy path**: When using `frame.toArrayBuffer()`, pixel data is copied
  from native to JS, then accessed from native code (slower, fallback).

**Usage with VisionCamera:**

```typescript
const frameOutput = useFrameOutput({
  pixelFormat: 'rgb',
  onFrame(frame) {
    'worklet';
    // Zero-copy approach (recommended)
    const nativeBuffer = frame.getNativeBuffer();
    const result = model.generateFromFrame(
      {
        nativeBuffer: nativeBuffer.pointer,
        width: frame.width,
        height: frame.height,
      },
      ...args
    );
    nativeBuffer.release();
    frame.dispose();
  },
});
```

#### Parameters

##### frameData

[`Frame`](../interfaces/Frame.md)

Frame data object with either nativeBuffer (zero-copy) or data (ArrayBuffer)

##### args

...`any`[]

Additional model-specific arguments (e.g., threshold, options)

#### Returns

`any`

Model-specific output (e.g., detections, classifications, embeddings)

#### See

[Frame](../interfaces/Frame.md) for frame data format details

#### Inherited from

`BaseModule.generateFromFrame`

---

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L17)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:86](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L86)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`input`, `imageSize?`, `numSteps?`, `seed?`): `Promise`\<`string`\>

Defined in: [modules/computer_vision/TextToImageModule.ts:106](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L106)

Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps.
The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string.

#### Parameters

##### input

`string`

The text prompt to generate the image from.

##### imageSize?

`number` = `512`

The desired width and height of the output image in pixels.

##### numSteps?

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

Defined in: [modules/BaseModule.ts:66](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L66)

**`Internal`**

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

Defined in: [modules/BaseModule.ts:77](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L77)

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

Defined in: [modules/computer_vision/TextToImageModule.ts:138](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L138)

Interrupts model generation. The model is stopped in the nearest step.

#### Returns

`void`

---

### load()

> **load**(`model`, `onDownloadProgressCallback?`): `Promise`\<`void`\>

Defined in: [modules/computer_vision/TextToImageModule.ts:36](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L36)

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

##### onDownloadProgressCallback?

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>
