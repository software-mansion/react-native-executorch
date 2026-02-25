# Interface: ObjectDetectionType

Defined in: [types/objectDetection.ts:151](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L151)

Return type for the `useObjectDetection` hook.
Manages the state and operations for Computer Vision object detection tasks.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/objectDetection.ts:170](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L170)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/objectDetection.ts:155](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L155)

Contains the error object if the model failed to load, download, or encountered a runtime error during detection.

---

### forward()

> **forward**: (`input`, `detectionThreshold?`) => `Promise`\<[`Detection`](Detection.md)[]\>

Defined in: [types/objectDetection.ts:199](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L199)

Executes the model's forward pass with automatic input type detection.

Supports two input types:

1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Parameters

##### input

Image source (string or PixelData object)

`string` | [`PixelData`](PixelData.md)

##### detectionThreshold?

`number`

An optional number between 0 and 1 representing the minimum confidence score. Default is 0.5.

#### Returns

`Promise`\<[`Detection`](Detection.md)[]\>

A Promise that resolves to an array of `Detection` objects.

#### Throws

If the model is not loaded or is currently processing another image.

#### Example

```typescript
// String path
const detections1 = await model.forward('file:///path/to/image.jpg');

// Pixel data
const detections2 = await model.forward({
  dataPtr: new Uint8Array(rgbPixels),
  sizes: [480, 640, 3],
  scalarType: ScalarType.BYTE,
});
```

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/objectDetection.ts:165](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L165)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/objectDetection.ts:160](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L160)

Indicates whether the object detection model is loaded and ready to process images.

---

### runOnFrame

> **runOnFrame**: (`frame`, `detectionThreshold`) => [`Detection`](Detection.md)[] \| `null`

Defined in: [types/objectDetection.ts:231](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L231)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Example

```typescript
const { runOnFrame, isReady } = useObjectDetection({ model: MODEL });

const frameOutput = useFrameOutput({
  onFrame(frame) {
    'worklet';
    if (!runOnFrame) return;
    const detections = runOnFrame(frame, 0.5);
    frame.dispose();
  },
});
```

#### Param

VisionCamera Frame object

#### Param

The threshold for detection sensitivity.

#### Returns

Array of Detection objects representing detected items in the frame.
