# Class: TextEmbeddingsModule

Defined in: [modules/natural\_language\_processing/TextEmbeddingsModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L19)

Module for managing a Text Embeddings model instance.

## Extends

- `BaseModule`

## Properties

### generateFromFrame()

> **generateFromFrame**: (`frameData`, ...`args`) => `any`

Defined in: [modules/BaseModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L53)

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
      { nativeBuffer: nativeBuffer.pointer, width: frame.width, height: frame.height },
      ...args
    );
    nativeBuffer.release();
    frame.dispose();
  }
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

***

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L16)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:81](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L81)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

***

### forward()

> **forward**(`input`, `role?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\> \| [`EmbeddingResult`](../interfaces/EmbeddingResult.md)\>

Defined in: [modules/natural\_language\_processing/TextEmbeddingsModule.ts:101](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L101)

Embed text into a pooled `Float32Array`, or a per-token `EmbeddingResult`
for `multiVector` models.

#### Parameters

##### input

`string`

The text to embed.

##### role?

[`EmbeddingRole`](../type-aliases/EmbeddingRole.md)

Optional role ('query' | 'document') for models with
  asymmetric prompts; prepends the model's prompt for that role.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\> \| [`EmbeddingResult`](../interfaces/EmbeddingResult.md)\>

A `Float32Array` for pooled models, an `EmbeddingResult` otherwise.

#### Throws

If the model is not loaded.

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:62](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L62)

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

***

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [modules/BaseModule.ts:72](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L72)

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

### fromCustomModel()

> `static` **fromCustomModel**(`modelSource`, `tokenizerSource`, `onDownloadProgress?`): `Promise`\<`TextEmbeddingsModule`\>

Defined in: [modules/natural\_language\_processing/TextEmbeddingsModule.ts:77](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L77)

Creates a text embeddings instance with a user-provided model binary.
Use this when working with a custom-exported embeddings model. Internally
uses `'custom'` as the model name. Note that prompts, multi-vector output,
and skipLists are model-config features and are not configured here.

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the tokenizer file.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`TextEmbeddingsModule`\>

A Promise resolving to a `TextEmbeddingsModule` instance.

***

### fromModelName()

> `static` **fromModelName**(`namedSources`, `onDownloadProgress?`): `Promise`\<`TextEmbeddingsModule`\>

Defined in: [modules/natural\_language\_processing/TextEmbeddingsModule.ts:42](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L42)

Creates a text embeddings instance for a built-in model.

#### Parameters

##### namedSources

[`TextEmbeddingsModel`](../interfaces/TextEmbeddingsModel.md)

An object specifying the model name, model source,
  tokenizer source, and optional `prompts` / `multiVector` / `skipListIds`.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress,
  receiving a value between 0 and 1.

#### Returns

`Promise`\<`TextEmbeddingsModule`\>

A Promise resolving to a `TextEmbeddingsModule` instance.
