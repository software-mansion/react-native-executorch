# Class: SemanticSegmentationModule\<T\>

Defined in: [modules/computer\_vision/SemanticSegmentationModule.ts:74](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L74)

Generic semantic segmentation module with type-safe label maps.
Use a model name (e.g. `'deeplab-v3-resnet50'`) as the generic parameter for built-in models,
or a custom label enum for custom configs.

## Extends

- `VisionLabeledModule`\<`Record`\<`"ARGMAX"`, `Int32Array`\> & `Record`\<keyof `ResolveLabels`\<`T`\>, `Float32Array`\>, `ResolveLabels`\<`T`\>\>

## Type Parameters

### T

`T` *extends* [`SemanticSegmentationModelName`](../type-aliases/SemanticSegmentationModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (`'deeplab-v3-resnet50'`,
  `'deeplab-v3-resnet50-quantized'`, `'deeplab-v3-resnet101'`,
  `'deeplab-v3-resnet101-quantized'`, `'deeplab-v3-mobilenet-v3-large'`,
  `'deeplab-v3-mobilenet-v3-large-quantized'`, `'lraspp-mobilenet-v3-large'`,
  `'lraspp-mobilenet-v3-large-quantized'`, `'fcn-resnet50'`,
  `'fcn-resnet50-quantized'`, `'fcn-resnet101'`, `'fcn-resnet101-quantized'`,
  `'selfie-segmentation'`) or a custom [LabelEnum](../type-aliases/LabelEnum.md) label map.

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

> **forward**\<`K`\>(`input`, `classesOfInterest?`, `resizeToInput?`): `Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

Defined in: [modules/computer\_vision/SemanticSegmentationModule.ts:191](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L191)

Executes the model's forward pass to perform semantic segmentation on the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### input

Image source (string or PixelData object)

`string` | [`PixelData`](../interfaces/PixelData.md)

##### classesOfInterest?

`K`[] = `[]`

An optional list of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.

##### resizeToInput?

`boolean` = `true`

Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.

#### Returns

`Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

A Promise resolving to an object with an `'ARGMAX'` key mapped to an `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.

#### Throws

If the model is not loaded.

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

> `static` **fromCustomModel**\<`L`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`SemanticSegmentationModule`\<`L`\>\>

Defined in: [modules/computer\_vision/SemanticSegmentationModule.ts:154](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L154)

Creates a segmentation instance with a user-provided model binary and label map.
Use this when working with a custom-exported segmentation model that is not one of the built-in models.
Internally uses `'custom'` as the model name for telemetry unless overridden.

## Required model contract

The `.pte` model binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in
`[0, 1]` after optional per-channel normalization `(pixel − mean) / std`.
H and W are read from the model's declared input shape at load time.

**Output:** one `float32` tensor of shape `[1, C, H_out, W_out]` (NCHW) containing raw
logits — one channel per class, in the same order as the entries in your `labelMap`.
For binary segmentation a single-channel output is also supported: channel 0 is treated
as the foreground probability and a synthetic background channel is added automatically.

Preprocessing (resize → normalize) and postprocessing (softmax, argmax, resize back to
original dimensions) are handled by the native runtime.

#### Type Parameters

##### L

`L` *extends* `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`SemanticSegmentationConfig`](../type-aliases/SemanticSegmentationConfig.md)\<`L`\>

A [SemanticSegmentationConfig](../type-aliases/SemanticSegmentationConfig.md) object with the label map and optional preprocessing parameters.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`SemanticSegmentationModule`\<`L`\>\>

A Promise resolving to a `SemanticSegmentationModule` instance typed to the provided label map.

#### Example

```ts
const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;
const segmentation = await SemanticSegmentationModule.fromCustomModel(
  'https://example.com/custom_model.pte',
  { labelMap: MyLabels },
);
```

***

### fromModelName()

> `static` **fromModelName**\<`C`\>(`namedSources`, `onDownloadProgress?`): `Promise`\<`SemanticSegmentationModule`\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

Defined in: [modules/computer\_vision/SemanticSegmentationModule.ts:96](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L96)

Creates a segmentation instance for a built-in model.
The config object is discriminated by `modelName` — each model can require different fields.

#### Type Parameters

##### C

`C` *extends* [`SemanticSegmentationModelSources`](../type-aliases/SemanticSegmentationModelSources.md)

#### Parameters

##### namedSources

`C`

A [SemanticSegmentationModelSources](../type-aliases/SemanticSegmentationModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`SemanticSegmentationModule`\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

A Promise resolving to a `SemanticSegmentationModule` instance typed to the chosen model's label map.

#### Example

```ts
const segmentation = await SemanticSegmentationModule.fromModelName(DEEPLAB_V3_RESNET50);
```
