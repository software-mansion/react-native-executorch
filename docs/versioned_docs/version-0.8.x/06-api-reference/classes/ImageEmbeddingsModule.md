# Class: ImageEmbeddingsModule

Defined in: [modules/computer\_vision/ImageEmbeddingsModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ImageEmbeddingsModule.ts#L13)

Module for generating image embeddings from input images.

## Extends

- `VisionModule`\<`Float32Array`\>

## Properties

### generateFromFrame()

> **generateFromFrame**: (`frameData`, ...`args`) => `any`

Defined in: [modules/BaseModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L53)

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

`VisionModule.generateFromFrame`

***

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L16)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`VisionModule.nativeModule`

## Accessors

### runOnFrame

#### Get Signature

> **get** **runOnFrame**(): (`frame`, ...`args`) => `TOutput`

Defined in: [modules/computer\_vision/VisionModule.ts:61](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VisionModule.ts#L61)

Synchronous worklet function for real-time VisionCamera frame processing.

Only available after the model is loaded.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

##### Example

```typescript
const model = new ClassificationModule();
await model.load({ modelSource: MODEL });

// Use the functional form of setState to store the worklet — passing it
// directly would cause React to invoke it immediately as an updater fn.
const [runOnFrame, setRunOnFrame] = useState(null);
setRunOnFrame(() => model.runOnFrame);

const frameOutput = useFrameOutput({
  onFrame(frame) {
    'worklet';
    if (!runOnFrame) return;
    const result = runOnFrame(frame, isFrontCamera);
    frame.dispose();
  }
});
```

##### Throws

If the model is not loaded.

##### Returns

A worklet function for frame processing.

> (`frame`, ...`args`): `TOutput`

###### Parameters

###### frame

[`Frame`](../interfaces/Frame.md)

###### args

...`any`[]

###### Returns

`TOutput`

#### Inherited from

`VisionModule.runOnFrame`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:81](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L81)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`VisionModule.delete`

***

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/computer\_vision/ImageEmbeddingsModule.ts:72](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ImageEmbeddingsModule.ts#L72)

Executes the model's forward pass with automatic input type detection.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.
This method is async and cannot be called in worklet context.

#### Parameters

##### input

Image source (string path or PixelData object)

`string` | [`PixelData`](../interfaces/PixelData.md)

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Promise that resolves to the model output.

#### Example

```typescript
// String path (async)
const result1 = await model.forward('file:///path/to/image.jpg');

// Pixel data (async)
const result2 = await model.forward({
  dataPtr: new Uint8Array(pixelBuffer),
  sizes: [480, 640, 3],
  scalarType: ScalarType.BYTE
});

// For VisionCamera frames, use runOnFrame in worklet:
const frameOutput = useFrameOutput({
  onFrame(frame) {
    'worklet';
    if (!model.runOnFrame) return;
    const result = model.runOnFrame(frame);
  }
});
```

#### Overrides

`VisionModule.forward`

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:62](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L62)

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

`VisionModule.forwardET`

***

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [modules/BaseModule.ts:72](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L72)

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

`VisionModule.getInputShape`

***

### fromCustomModel()

> `static` **fromCustomModel**(`modelSource`, `onDownloadProgress?`): `Promise`\<`ImageEmbeddingsModule`\>

Defined in: [modules/computer\_vision/ImageEmbeddingsModule.ts:62](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ImageEmbeddingsModule.ts#L62)

Creates an image embeddings instance with a user-provided model binary.
Use this when working with a custom-exported model that is not one of the built-in presets.

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ImageEmbeddingsModule`\>

A Promise resolving to an `ImageEmbeddingsModule` instance.

#### Remarks

The native model contract for this method is not formally defined and may change
between releases. Refer to the native source code for the current expected tensor interface.

***

### fromModelName()

> `static` **fromModelName**(`namedSources`, `onDownloadProgress?`): `Promise`\<`ImageEmbeddingsModule`\>

Defined in: [modules/computer\_vision/ImageEmbeddingsModule.ts:24](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ImageEmbeddingsModule.ts#L24)

Creates an image embeddings instance for a built-in model.

#### Parameters

##### namedSources

An object specifying which built-in model to load and where to fetch it from.

###### modelName

[`ImageEmbeddingsModelName`](../type-aliases/ImageEmbeddingsModelName.md)

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ImageEmbeddingsModule`\>

A Promise resolving to an `ImageEmbeddingsModule` instance.
