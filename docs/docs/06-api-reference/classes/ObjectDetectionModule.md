# Class: ObjectDetectionModule\<T\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:59](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L59)

Generic object detection module with type-safe label maps.

## Extends

- `VisionLabeledModule`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`\>\>[], `ResolveLabels`\<`T`\>\>

## Type Parameters

### T

`T` _extends_ [`ObjectDetectionModelName`](../type-aliases/ObjectDetectionModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (e.g. `'ssdlite-320-mobilenet-v3-large'`)
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

`VisionLabeledModule.generateFromFrame`

---

### labelMap

> `protected` `readonly` **labelMap**: `ResolveLabels`

Defined in: [modules/computer_vision/VisionLabeledModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VisionLabeledModule.ts#L16)

#### Inherited from

`VisionLabeledModule.labelMap`

---

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L17)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`VisionLabeledModule.nativeModule`

## Accessors

### runOnFrame

#### Get Signature

> **get** **runOnFrame**(): (`frame`, ...`args`) => `TOutput` \| `null`

Defined in: [modules/computer_vision/VisionModule.ts:61](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VisionModule.ts#L61)

Synchronous worklet function for real-time VisionCamera frame processing.

Only available after the model is loaded. Returns null if not loaded.

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
    const result = runOnFrame(frame);
    frame.dispose();
  },
});
```

##### Returns

(`frame`, ...`args`) => `TOutput` \| `null`

#### Inherited from

`VisionLabeledModule.runOnFrame`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:86](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L86)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`VisionLabeledModule.delete`

---

### forward()

> **forward**(`input`, `detectionThreshold?`): `Promise`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:118](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L118)

Executes the model's forward pass to detect objects within the provided image.

#### Parameters

##### input

A string image source (file path, URI, or Base64) or a [PixelData](../interfaces/PixelData.md) object.

`string` | [`PixelData`](../interfaces/PixelData.md)

##### detectionThreshold?

`number` = `0.7`

Minimum confidence score for a detection to be included. Default is 0.7.

#### Returns

`Promise`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

A Promise resolving to an array of [Detection](../interfaces/Detection.md) objects.

#### Overrides

`VisionLabeledModule.forward`

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

`VisionLabeledModule.forwardET`

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

`VisionLabeledModule.getInputShape`

---

### fromCustomConfig()

> `static` **fromCustomConfig**\<`L`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`ObjectDetectionModule`\<`L`\>\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:125](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L125)

#### Type Parameters

##### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### config

[`ObjectDetectionConfig`](../type-aliases/ObjectDetectionConfig.md)\<`L`\>

##### onDownloadProgress?

(`progress`) => `void`

#### Returns

`Promise`\<`ObjectDetectionModule`\<`L`\>\>

---

### fromModelName()

> `static` **fromModelName**\<`C`\>(`config`, `onDownloadProgress?`): `Promise`\<`ObjectDetectionModule`\<`ModelNameOf`\<`C`\>\>\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:73](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L73)

Creates an object detection instance for a built-in model.

#### Type Parameters

##### C

`C` _extends_ [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

#### Parameters

##### config

`C`

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ObjectDetectionModule`\<`ModelNameOf`\<`C`\>\>\>

A Promise resolving to an `ObjectDetectionModule` instance typed to the chosen model's label map.
