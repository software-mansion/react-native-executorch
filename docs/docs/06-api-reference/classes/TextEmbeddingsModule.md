# Class: TextEmbeddingsModule

Defined in: [modules/natural_language_processing/TextEmbeddingsModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L13)

Module for generating text embeddings from input text.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new TextEmbeddingsModule**(): `TextEmbeddingsModule`

#### Returns

`TextEmbeddingsModule`

#### Inherited from

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

Defined in: [modules/BaseModule.ts:100](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L100)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextEmbeddingsModule.ts:63](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L63)

Executes the model's forward pass, where `input` is a text that will be embedded.

#### Parameters

##### input

`string`

The text string to embed.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Float32Array containing the vector embeddings.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:80](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L80)

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

Defined in: [modules/BaseModule.ts:91](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L91)

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

> **load**(`model`, `onDownloadProgressCallback?`): `Promise`\<`void`\>

Defined in: [modules/natural_language_processing/TextEmbeddingsModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L22)

Loads the model and tokenizer specified by the config object.

#### Parameters

##### model

Object containing model and tokenizer sources.

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the text embeddings model binary.

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the tokenizer JSON file.

##### onDownloadProgressCallback?

(`progress`) => `void`

Optional callback to track download progress (value between 0 and 1).

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
