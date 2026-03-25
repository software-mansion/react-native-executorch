# Class: ObjectDetectionModule\<T\>

Defined in: [modules/computer\_vision/ObjectDetectionModule.ts:86](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L86)

Generic object detection module with type-safe label maps.

## Extends

- `VisionLabeledModule`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`\>\>[], `ResolveLabels`\<`T`\>\>

## Type Parameters

### T

`T` *extends* [`ObjectDetectionModelName`](../type-aliases/ObjectDetectionModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (e.g. `'ssdlite-320-mobilenet-v3-large'`)
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

> **get** **runOnFrame**(): (`frame`, `isFrontCamera`, `options?`) => [`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]

Defined in: [modules/computer\_vision/ObjectDetectionModule.ts:155](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L155)

Override runOnFrame to provide an options-based API for VisionCamera integration.

##### Throws

If the underlying native worklet is unavailable (should not occur on a loaded module).

##### Returns

A worklet function for frame processing.

> (`frame`, `isFrontCamera`, `options?`): [`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]

###### Parameters

###### frame

[`Frame`](../interfaces/Frame.md)

###### isFrontCamera

`boolean`

###### options?

[`ObjectDetectionOptions`](../interfaces/ObjectDetectionOptions.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>

###### Returns

[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]

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

> **forward**(`input`, `options?`): `Promise`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

Defined in: [modules/computer\_vision/ObjectDetectionModule.ts:247](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L247)

Executes the model's forward pass to detect objects within the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

#### Parameters

##### input

A string image source (file path, URI, or Base64) or a [PixelData](../interfaces/PixelData.md) object.

`string` | [`PixelData`](../interfaces/PixelData.md)

##### options?

[`ObjectDetectionOptions`](../interfaces/ObjectDetectionOptions.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>

Optional configuration for detection inference. Includes `detectionThreshold`, `inputSize`, and `classesOfInterest`.

#### Returns

`Promise`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `availableInputSizes`: `undefined`; `defaultDetectionThreshold`: `0.7`; `defaultInputSize`: `undefined`; `defaultIouThreshold`: `0.55`; `labelMap`: *typeof* [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; `yolo26l`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26m`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26n`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26s`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; `yolo26x`: \{ `availableInputSizes`: readonly \[`384`, `512`, `640`\]; `defaultDetectionThreshold`: `number`; `defaultInputSize`: `number`; `defaultIouThreshold`: `number`; `labelMap`: *typeof* [`CocoLabelYolo`](../enumerations/CocoLabelYolo.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

A Promise resolving to an array of [Detection](../interfaces/Detection.md) objects.

#### Throws

If the model is not loaded or if an invalid `inputSize` is provided.

#### Example

```typescript
const detections = await model.forward('path/to/image.jpg', {
  detectionThreshold: 0.7,
  inputSize: 640,  // For YOLO models
  classesOfInterest: ['PERSON', 'CAR'],
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

Defined in: [modules/computer\_vision/ObjectDetectionModule.ts:146](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L146)

Returns the available input sizes for this model, or undefined if the model accepts any size.

#### Returns

readonly `number`[] \| `undefined`

An array of available input sizes, or undefined if not constrained.

#### Example

```typescript
const sizes = model.getAvailableInputSizes(); // [384, 512, 640] for YOLO models, or undefined for RF-DETR
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

### fromCustomModel()

> `static` **fromCustomModel**\<`L`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`ObjectDetectionModule`\<`L`\>\>

Defined in: [modules/computer\_vision/ObjectDetectionModule.ts:340](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L340)

Creates an object detection instance with a user-provided model binary and label map.
Use this when working with a custom-exported model that is not one of the built-in presets.
Internally uses `'custom'` as the model name for telemetry unless overridden.

## Required model contract

The `.pte` model binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in
`[0, 1]` after optional per-channel normalization `(pixel − mean) / std`.
H and W are read from the model's declared input shape at load time.

**Outputs:** exactly three `float32` tensors, in this order:
1. Bounding boxes — flat `[4·N]` array of `(x1, y1, x2, y2)` coordinates in model-input
   pixel space, repeated for N detections.
2. Confidence scores — flat `[N]` array of values in `[0, 1]`.
3. Class indices — flat `[N]` array of `float32`-encoded integer class indices
   (0-based, matching the order of entries in your `labelMap`).

Preprocessing (resize → normalize) and postprocessing (coordinate rescaling, threshold
filtering, NMS) are handled by the native runtime — your model only needs to produce
the raw detections above.

#### Type Parameters

##### L

`L` *extends* `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`ObjectDetectionConfig`](../type-aliases/ObjectDetectionConfig.md)\<`L`\>

A [ObjectDetectionConfig](../type-aliases/ObjectDetectionConfig.md) object with the label map and optional preprocessing parameters.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ObjectDetectionModule`\<`L`\>\>

A Promise resolving to an `ObjectDetectionModule` instance typed to the provided label map.

***

### fromModelName()

> `static` **fromModelName**\<`C`\>(`namedSources`, `onDownloadProgress?`): `Promise`\<`ObjectDetectionModule`\<`ModelNameOf`\<`C`\>\>\>

Defined in: [modules/computer\_vision/ObjectDetectionModule.ts:106](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L106)

Creates an object detection instance for a built-in model.

#### Type Parameters

##### C

`C` *extends* [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

#### Parameters

##### namedSources

`C`

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ObjectDetectionModule`\<`ModelNameOf`\<`C`\>\>\>

A Promise resolving to an `ObjectDetectionModule` instance typed to the chosen model's label map.
