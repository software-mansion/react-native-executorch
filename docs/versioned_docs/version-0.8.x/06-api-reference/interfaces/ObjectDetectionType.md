# Interface: ObjectDetectionType\<L\>

Defined in: [types/objectDetection.ts:116](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L116)

Return type for the `useObjectDetection` hook.
Manages the state and operations for Computer Vision object detection tasks.

## Type Parameters

### L

`L` *extends* [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/objectDetection.ts:135](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L135)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/objectDetection.ts:120](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L120)

Contains the error object if the model failed to load, download, or encountered a runtime error during detection.

***

### forward()

> **forward**: (`input`, `options?`) => `Promise`\<[`Detection`](Detection.md)\<`L`\>[]\>

Defined in: [types/objectDetection.ts:160](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L160)

Executes the model's forward pass with automatic input type detection.

#### Parameters

##### input

Image source (string path/URI or PixelData object)

`string` | [`PixelData`](PixelData.md)

##### options?

[`ObjectDetectionOptions`](ObjectDetectionOptions.md)\<`L`\>

Optional configuration for detection inference

#### Returns

`Promise`\<[`Detection`](Detection.md)\<`L`\>[]\>

A Promise that resolves to an array of `Detection` objects.

#### Throws

If the model is not loaded or is currently processing another image.

#### Example

```typescript
// String path with options
const detections1 = await model.forward('file:///path/to/image.jpg', {
  detectionThreshold: 0.7,
  inputSize: 640,  // For YOLO models
  classesOfInterest: ['PERSON', 'CAR']
});

// Pixel data
const detections2 = await model.forward({
  dataPtr: new Uint8Array(rgbPixels),
  sizes: [480, 640, 3],
  scalarType: ScalarType.BYTE
}, { detectionThreshold: 0.5 });
```

***

### getAvailableInputSizes()

> **getAvailableInputSizes**: () => readonly `number`[] \| `undefined`

Defined in: [types/objectDetection.ts:174](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L174)

Returns the available input sizes for multi-method models (e.g., YOLO).
Returns undefined for single-method models (e.g., RF-DETR, SSDLite).

#### Returns

readonly `number`[] \| `undefined`

Array of available input sizes or undefined

#### Example

```typescript
const sizes = model.getAvailableInputSizes(); // [384, 512, 640] for YOLO models
```

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/objectDetection.ts:130](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L130)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/objectDetection.ts:125](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L125)

Indicates whether the object detection model is loaded and ready to process images.

***

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`, `options?`) => [`Detection`](Detection.md)\<`L`\>[] \| `null`

Defined in: [types/objectDetection.ts:189](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L189)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Param

Whether the front camera is active, used for mirroring corrections.

#### Param

Optional configuration for detection inference

#### Returns

Array of Detection objects representing detected items in the frame.
