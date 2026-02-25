# Class: ImageSegmentationModule\<T\>

Defined in: [modules/computer_vision/ImageSegmentationModule.ts:60](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L60)

Generic image segmentation module with type-safe label maps.
Use a model name (e.g. `'deeplab-v3'`) as the generic parameter for built-in models,
or a custom label enum for custom configs.

## Extends

- `BaseModule`

## Type Parameters

### T

`T` _extends_ [`SegmentationModelName`](../type-aliases/SegmentationModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (`'deeplab-v3'`, `'selfie-segmentation'`)
or a custom [LabelEnum](../type-aliases/LabelEnum.md) label map.

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

> **forward**\<`K`\>(`imageSource`, `classesOfInterest`, `resizeToInput`): `Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

Defined in: [modules/computer_vision/ImageSegmentationModule.ts:176](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L176)

Executes the model's forward pass to perform semantic segmentation on the provided image.

#### Type Parameters

##### K

`K` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or Base64-encoded string).

##### classesOfInterest

`K`[] = `[]`

An optional list of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.

##### resizeToInput

`boolean` = `true`

Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.

#### Returns

`Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

A Promise resolving to an object with an `'ARGMAX'` key mapped to an `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.

#### Throws

If the model is not loaded.

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

> **load**(): `Promise`\<`void`\>

Defined in: [modules/computer_vision/ImageSegmentationModule.ts:76](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L76)

Load the model and prepare it for inference.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`

---

### fromCustomConfig()

> `static` **fromCustomConfig**\<`L`\>(`modelSource`, `config`, `onDownloadProgress`): `Promise`\<`ImageSegmentationModule`\<`L`\>\>

Defined in: [modules/computer_vision/ImageSegmentationModule.ts:142](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L142)

Creates a segmentation instance with a user-provided label map and custom config.
Use this when working with a custom-exported segmentation model that is not one of the built-in models.

#### Type Parameters

##### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`SegmentationConfig`](../type-aliases/SegmentationConfig.md)\<`L`\>

A [SegmentationConfig](../type-aliases/SegmentationConfig.md) object with the label map and optional preprocessing parameters.

##### onDownloadProgress

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ImageSegmentationModule`\<`L`\>\>

A Promise resolving to an `ImageSegmentationModule` instance typed to the provided label map.

#### Example

```ts
const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;
const segmentation = await ImageSegmentationModule.fromCustomConfig(
  'https://example.com/custom_model.pte',
  { labelMap: MyLabels }
);
```

---

### fromModelName()

> `static` **fromModelName**\<`C`\>(`config`, `onDownloadProgress`): `Promise`\<`ImageSegmentationModule`\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

Defined in: [modules/computer_vision/ImageSegmentationModule.ts:95](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L95)

Creates a segmentation instance for a built-in model.
The config object is discriminated by `modelName` — each model can require different fields.

#### Type Parameters

##### C

`C` _extends_ [`ModelSources`](../type-aliases/ModelSources.md)

#### Parameters

##### config

`C`

A [ModelSources](../type-aliases/ModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ImageSegmentationModule`\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

A Promise resolving to an `ImageSegmentationModule` instance typed to the chosen model's label map.

#### Example

```ts
const segmentation = await ImageSegmentationModule.fromModelName({
  modelName: 'deeplab-v3',
  modelSource: 'https://example.com/deeplab.pte',
});
```
