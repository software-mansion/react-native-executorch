# Class: InstanceSegmentationModule\<T\>

Defined in: [modules/computer\_vision/InstanceSegmentationModule.ts:136](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/InstanceSegmentationModule.ts#L136)

Generic instance segmentation module with type-safe label maps.
Use a model name (e.g. `'yolo26n-seg'`) as the generic parameter for pre-configured models,
or a custom label enum for custom configs.

Supported models (download from HuggingFace):
- `yolo26n-seg`, `yolo26s-seg`, `yolo26m-seg`, `yolo26l-seg`, `yolo26x-seg` - YOLO models with COCO labels (80 classes)
- `rfdetr-nano-seg` - RF-DETR Nano model with COCO labels (80 classes)

## Example

```ts
const segmentation = await InstanceSegmentationModule.fromModelName({
  modelName: 'yolo26n-seg',
  modelSource: 'https://huggingface.co/.../yolo26n-seg.pte',
});

const results = await segmentation.forward('path/to/image.jpg', {
  confidenceThreshold: 0.5,
  iouThreshold: 0.45,
  maxInstances: 20,
  inputSize: 640,
});
```

## Extends

- `VisionLabeledModule`\<[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`ResolveLabels`\<`T`\>\>[], `ResolveLabels`\<`T`\>\>

## Type Parameters

### T

`T` *extends* [`InstanceSegmentationModelName`](../type-aliases/InstanceSegmentationModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a pre-configured model name from [InstanceSegmentationModelName](../type-aliases/InstanceSegmentationModelName.md)
  or a custom label map conforming to [LabelEnum](../type-aliases/LabelEnum.md).

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

> **get** **runOnFrame**(): (`frame`, `isFrontCamera`, `options?`) => [`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>[]

Defined in: [modules/computer\_vision/InstanceSegmentationModule.ts:282](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/InstanceSegmentationModule.ts#L282)

Override runOnFrame to add label mapping for VisionCamera integration.
The parent's runOnFrame returns raw native results with class indices;
this override maps them to label strings and provides an options-based API.

##### Throws

If the underlying native worklet is unavailable (should not occur on a loaded module).

##### Returns

A worklet function for VisionCamera frame processing.

> (`frame`, `isFrontCamera`, `options?`): [`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>[]

###### Parameters

###### frame

[`Frame`](../interfaces/Frame.md)

###### isFrontCamera

`boolean`

###### options?

[`InstanceSegmentationOptions`](../interfaces/InstanceSegmentationOptions.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>

###### Returns

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>[]

#### Overrides

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

> **forward**(`input`, `options?`): `Promise`\<[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

Defined in: [modules/computer\_vision/InstanceSegmentationModule.ts:387](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/InstanceSegmentationModule.ts#L387)

Executes the model's forward pass to perform instance segmentation on the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

#### Parameters

##### input

Image source (string path or PixelData object)

`string` | [`PixelData`](../interfaces/PixelData.md)

##### options?

[`InstanceSegmentationOptions`](../interfaces/InstanceSegmentationOptions.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>

Optional configuration for the segmentation process. Includes `confidenceThreshold`, `iouThreshold`, `maxInstances`, `classesOfInterest`, `returnMaskAtOriginalResolution`, and `inputSize`.

#### Returns

`Promise`\<[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`ResolveLabels`\<`T`, \{ `rfdetr-nano-seg`: \{ `availableInputSizes`: `undefined`; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `postprocessorConfig`: \{ `applyNMS`: `true`; \}; `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `yolo26l-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26m-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26n-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26s-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; `yolo26x-seg`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultConfidenceThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `postprocessorConfig`: \{ `applyNMS`: `false`; \}; `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

A Promise resolving to an array of [SegmentedInstance](../interfaces/SegmentedInstance.md) objects with `bbox`, `mask`, `maskWidth`, `maskHeight`, `label`, `score`.

#### Throws

If the model is not loaded or if an invalid `inputSize` is provided.

#### Example

```ts
const results = await segmentation.forward('path/to/image.jpg', {
  confidenceThreshold: 0.6,
  iouThreshold: 0.5,
  maxInstances: 10,
  inputSize: 640,
  classesOfInterest: ['PERSON', 'CAR'],
  returnMaskAtOriginalResolution: true,
});

results.forEach((inst) => {
  console.log(`${inst.label}: ${(inst.score * 100).toFixed(1)}%`);
});
```

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

### getAvailableInputSizes()

> **getAvailableInputSizes**(): readonly `number`[] \| `undefined`

Defined in: [modules/computer\_vision/InstanceSegmentationModule.ts:271](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/InstanceSegmentationModule.ts#L271)

Returns the available input sizes for this model, or undefined if the model accepts any size.

#### Returns

readonly `number`[] \| `undefined`

An array of available input sizes, or undefined if not constrained.

#### Example

```ts
const sizes = segmentation.getAvailableInputSizes();
console.log(sizes); // [384, 512, 640] for YOLO models, or undefined for RF-DETR
```

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

### fromCustomConfig()

> `static` **fromCustomConfig**\<`L`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`InstanceSegmentationModule`\<`L`\>\>

Defined in: [modules/computer\_vision/InstanceSegmentationModule.ts:230](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/InstanceSegmentationModule.ts#L230)

Creates an instance segmentation module with a user-provided label map and custom config.
Use this when working with a custom-exported segmentation model that is not one of the pre-configured models.

#### Type Parameters

##### L

`L` *extends* `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`InstanceSegmentationConfig`](../type-aliases/InstanceSegmentationConfig.md)\<`L`\>

A [InstanceSegmentationConfig](../type-aliases/InstanceSegmentationConfig.md) object with the label map and optional preprocessing parameters.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`InstanceSegmentationModule`\<`L`\>\>

A Promise resolving to an `InstanceSegmentationModule` instance typed to the provided label map.

#### Example

```ts
const MyLabels = { PERSON: 0, CAR: 1 } as const;
const segmentation = await InstanceSegmentationModule.fromCustomConfig(
  'https://huggingface.co/.../custom_model.pte',
  {
    labelMap: MyLabels,
    availableInputSizes: [640],
    defaultInputSize: 640,
    defaultConfidenceThreshold: 0.5,
    defaultIouThreshold: 0.45,
    postprocessorConfig: { applyNMS: true },
  },
);
```

***

### fromModelName()

> `static` **fromModelName**\<`C`\>(`config`, `onDownloadProgress?`): `Promise`\<`InstanceSegmentationModule`\<[`InstanceModelNameOf`](../type-aliases/InstanceModelNameOf.md)\<`C`\>\>\>

Defined in: [modules/computer\_vision/InstanceSegmentationModule.ts:173](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/InstanceSegmentationModule.ts#L173)

Creates an instance segmentation module for a pre-configured model.
The config object is discriminated by `modelName` — each model can require different fields.

#### Type Parameters

##### C

`C` *extends* [`InstanceSegmentationModelSources`](../type-aliases/InstanceSegmentationModelSources.md)

#### Parameters

##### config

`C`

A [InstanceSegmentationModelSources](../type-aliases/InstanceSegmentationModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`InstanceSegmentationModule`\<[`InstanceModelNameOf`](../type-aliases/InstanceModelNameOf.md)\<`C`\>\>\>

A Promise resolving to an `InstanceSegmentationModule` instance typed to the chosen model's label map.

#### Example

```ts
const segmentation = await InstanceSegmentationModule.fromModelName({
  modelName: 'yolo26n-seg',
  modelSource: 'https://huggingface.co/.../yolo26n-seg.pte',
});
```
