# Class: ClassificationModule\<T\>

Defined in: [modules/computer\_vision/ClassificationModule.ts:48](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ClassificationModule.ts#L48)

Generic classification module with type-safe label maps.

## Extends

- `VisionLabeledModule`\<`Record`\<keyof `ResolveLabels`\<`T`\>, `number`\>, `ResolveLabels`\<`T`\>\>

## Type Parameters

### T

`T` *extends* [`ClassificationModelName`](../type-aliases/ClassificationModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (e.g. `'efficientnet-v2-s'`)
  or a custom [LabelEnum](../type-aliases/LabelEnum.md) label map.

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

`VisionLabeledModule.generateFromFrame`

***

### labelMap

> `protected` `readonly` **labelMap**: `ResolveLabels`

Defined in: [modules/computer\_vision/VisionLabeledModule.ts:42](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VisionLabeledModule.ts#L42)

#### Inherited from

`VisionLabeledModule.labelMap`

***

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L16)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`VisionLabeledModule.nativeModule`

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

`VisionLabeledModule.runOnFrame`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:81](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/BaseModule.ts#L81)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`VisionLabeledModule.delete`

***

### forward()

> **forward**(`input`): `Promise`\<`Record`\<keyof `ResolveLabels`\<`T`, \{ `efficientnet-v2-s`: \{ `labelMap`: *typeof* [`Imagenet1kLabel`](../enumerations/Imagenet1kLabel.md); \}; `efficientnet-v2-s-quantized`: \{ `labelMap`: *typeof* [`Imagenet1kLabel`](../enumerations/Imagenet1kLabel.md); \}; \}\>, `number`\>\>

Defined in: [modules/computer\_vision/ClassificationModule.ts:145](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ClassificationModule.ts#L145)

Executes the model's forward pass to classify the provided image.

#### Parameters

##### input

A string image source (file path, URI, or Base64) or a [PixelData](../interfaces/PixelData.md) object.

`string` | [`PixelData`](../interfaces/PixelData.md)

#### Returns

`Promise`\<`Record`\<keyof `ResolveLabels`\<`T`, \{ `efficientnet-v2-s`: \{ `labelMap`: *typeof* [`Imagenet1kLabel`](../enumerations/Imagenet1kLabel.md); \}; `efficientnet-v2-s-quantized`: \{ `labelMap`: *typeof* [`Imagenet1kLabel`](../enumerations/Imagenet1kLabel.md); \}; \}\>, `number`\>\>

A Promise resolving to an object mapping label keys to confidence scores.

#### Overrides

`VisionLabeledModule.forward`

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

`VisionLabeledModule.forwardET`

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

`VisionLabeledModule.getInputShape`

***

### fromCustomModel()

> `static` **fromCustomModel**\<`L`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`ClassificationModule`\<`L`\>\>

Defined in: [modules/computer\_vision/ClassificationModule.ts:113](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ClassificationModule.ts#L113)

Creates a classification instance with a user-provided model binary and label map.
Use this when working with a custom-exported model that is not one of the built-in presets.

## Required model contract

The `.pte` model binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in
`[0, 1]` after optional per-channel normalization `(pixel − mean) / std`.
H and W are read from the model's declared input shape at load time.

**Output:** one `float32` tensor of shape `[1, C]` containing raw logits — one value per class,
in the same order as the entries in your `labelMap`. Softmax is applied by the native runtime.

#### Type Parameters

##### L

`L` *extends* `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`ClassificationConfig`](../type-aliases/ClassificationConfig.md)\<`L`\>

A [ClassificationConfig](../type-aliases/ClassificationConfig.md) object with the label map and optional preprocessing parameters.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ClassificationModule`\<`L`\>\>

A Promise resolving to a `ClassificationModule` instance typed to the provided label map.

***

### fromModelName()

> `static` **fromModelName**\<`C`\>(`namedSources`, `onDownloadProgress?`): `Promise`\<`ClassificationModule`\<`ModelNameOf`\<`C`\>\>\>

Defined in: [modules/computer\_vision/ClassificationModule.ts:64](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ClassificationModule.ts#L64)

Creates a classification instance for a built-in model.

#### Type Parameters

##### C

`C` *extends* [`ClassificationModelSources`](../type-aliases/ClassificationModelSources.md)

#### Parameters

##### namedSources

`C`

A [ClassificationModelSources](../type-aliases/ClassificationModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ClassificationModule`\<`ModelNameOf`\<`C`\>\>\>

A Promise resolving to a `ClassificationModule` instance typed to the chosen model's label map.
