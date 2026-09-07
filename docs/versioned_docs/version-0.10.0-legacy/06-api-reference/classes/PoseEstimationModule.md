# Class: PoseEstimationModule\<T\>

Defined in: [modules/computer_vision/PoseEstimationModule.ts:81](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L81)

Pose estimation module for detecting human body keypoints.

## Extends

- `VisionModule`\<[`PoseDetections`](../type-aliases/PoseDetections.md)\<`ResolveKeypoints`\<`T`\>\>\>

## Type Parameters

### T

`T` _extends_ [`PoseEstimationModelName`](../type-aliases/PoseEstimationModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (e.g. `'yolo26n-pose'`)
or a custom [LabelEnum](../type-aliases/LabelEnum.md) keypoint map.

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

`VisionModule.generateFromFrame`

---

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L16)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`VisionModule.nativeModule`

## Accessors

### runOnFrame

#### Get Signature

> **get** **runOnFrame**(): (`frame`, `isFrontCamera`, `options?`) => [`PoseDetections`](../type-aliases/PoseDetections.md)\<`ResolveConfigOrType`\<`T`, \{ `yolo26n-pose`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultKeypointThreshold`: `number`; `keypointMap`: _typeof_ [`CocoKeypoint`](../enumerations/CocoKeypoint.md); `preprocessorConfig`: `undefined`; \}; \}, `"keypointMap"`\>\>

Defined in: [modules/computer_vision/PoseEstimationModule.ts:190](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L190)

Override runOnFrame to provide an options-based API for VisionCamera integration.

##### Returns

A worklet function for frame processing.

> (`frame`, `isFrontCamera`, `options?`): [`PoseDetections`](../type-aliases/PoseDetections.md)\<`ResolveConfigOrType`\<`T`, \{ `yolo26n-pose`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultKeypointThreshold`: `number`; `keypointMap`: _typeof_ [`CocoKeypoint`](../enumerations/CocoKeypoint.md); `preprocessorConfig`: `undefined`; \}; \}, `"keypointMap"`\>\>

###### Parameters

###### frame

[`Frame`](../interfaces/Frame.md)

###### isFrontCamera

`boolean`

###### options?

[`PoseEstimationOptions`](../interfaces/PoseEstimationOptions.md)

###### Returns

[`PoseDetections`](../type-aliases/PoseDetections.md)\<`ResolveConfigOrType`\<`T`, \{ `yolo26n-pose`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultKeypointThreshold`: `number`; `keypointMap`: _typeof_ [`CocoKeypoint`](../enumerations/CocoKeypoint.md); `preprocessorConfig`: `undefined`; \}; \}, `"keypointMap"`\>\>

#### Overrides

`VisionModule.runOnFrame`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:81](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L81)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`VisionModule.delete`

---

### forward()

> **forward**(`input`, `options?`): `Promise`\<[`PoseDetections`](../type-aliases/PoseDetections.md)\<`ResolveConfigOrType`\<`T`, \{ `yolo26n-pose`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultKeypointThreshold`: `number`; `keypointMap`: _typeof_ [`CocoKeypoint`](../enumerations/CocoKeypoint.md); `preprocessorConfig`: `undefined`; \}; \}, `"keypointMap"`\>\>\>

Defined in: [modules/computer_vision/PoseEstimationModule.ts:271](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L271)

Run pose estimation on an image.

#### Parameters

##### input

Image path/URI or PixelData

`string` | [`PixelData`](../interfaces/PixelData.md)

##### options?

[`PoseEstimationOptions`](../interfaces/PoseEstimationOptions.md)

Detection options including inputSize for multi-method models

#### Returns

`Promise`\<[`PoseDetections`](../type-aliases/PoseDetections.md)\<`ResolveConfigOrType`\<`T`, \{ `yolo26n-pose`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultKeypointThreshold`: `number`; `keypointMap`: _typeof_ [`CocoKeypoint`](../enumerations/CocoKeypoint.md); `preprocessorConfig`: `undefined`; \}; \}, `"keypointMap"`\>\>\>

Array of detected people, each with keypoints accessible via the keypoint enum

#### Overrides

`VisionModule.forward`

---

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

`VisionModule.forwardET`

---

### getAvailableInputSizes()

> **getAvailableInputSizes**(): readonly `number`[] \| `undefined`

Defined in: [modules/computer_vision/PoseEstimationModule.ts:182](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L182)

Returns the available input sizes for this model, or undefined if the model accepts any size.

#### Returns

readonly `number`[] \| `undefined`

a readonly number[] specifying what input sizes the model supports.

---

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

`VisionModule.getInputShape`

---

### getKeypointMap()

> **getKeypointMap**(): `ResolveConfigOrType`\<`T`\>

Defined in: [modules/computer_vision/PoseEstimationModule.ts:174](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L174)

Get the keypoint map for this model.

#### Returns

`ResolveConfigOrType`\<`T`\>

Map of keypoint names to indices, e.g. `{ NOSE: 0, LEFT_EYE: 1, ... }`.

---

### fromCustomModel()

> `static` **fromCustomModel**\<`K`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`PoseEstimationModule`\<`K`\>\>

Defined in: [modules/computer_vision/PoseEstimationModule.ts:147](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L147)

Creates a pose estimation instance with a user-provided model binary and keypoint map.
Use this when working with a custom-exported model that is not one of the built-in presets.

#### Type Parameters

##### K

`K` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`PoseEstimationConfig`](../type-aliases/PoseEstimationConfig.md)\<`K`\>

A [PoseEstimationConfig](../type-aliases/PoseEstimationConfig.md) object with the keypoint map and optional preprocessing parameters.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress (0-1).

#### Returns

`Promise`\<`PoseEstimationModule`\<`K`\>\>

A Promise resolving to a `PoseEstimationModule` instance typed to the provided keypoint map.

---

### fromModelName()

> `static` **fromModelName**\<`C`\>(`namedSources`, `onDownloadProgress?`): `Promise`\<`PoseEstimationModule`\<`ModelNameOf`\<`C`\>\>\>

Defined in: [modules/computer_vision/PoseEstimationModule.ts:113](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/computer_vision/PoseEstimationModule.ts#L113)

Creates a pose estimation instance for a built-in model.

#### Type Parameters

##### C

`C` _extends_ [`PoseEstimationModelSources`](../type-aliases/PoseEstimationModelSources.md)

#### Parameters

##### namedSources

`C`

A [PoseEstimationModelSources](../type-aliases/PoseEstimationModelSources.md) object specifying which model to load.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress (0-1).

#### Returns

`Promise`\<`PoseEstimationModule`\<`ModelNameOf`\<`C`\>\>\>

A Promise resolving to a `PoseEstimationModule` instance typed to the model's keypoint map.
