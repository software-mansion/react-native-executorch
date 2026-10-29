# Interface: PoseEstimationType\<K\>

Defined in: [types/poseEstimation.ts:111](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L111)

Return type of usePoseEstimation hook.

## Type Parameters

### K

`K` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's keypoint schema.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/poseEstimation.ts:130](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L130)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/poseEstimation.ts:115](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L115)

Contains the error object if the model failed to load or encountered a runtime error.

---

### forward()

> **forward**: (`input`, `options?`) => `Promise`\<[`PoseDetections`](../type-aliases/PoseDetections.md)\<`K`\>\>

Defined in: [types/poseEstimation.ts:138](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L138)

Run pose estimation on an image.

#### Parameters

##### input

Image path/URI or PixelData

`string` | [`PixelData`](PixelData.md)

##### options?

[`PoseEstimationOptions`](PoseEstimationOptions.md)

Detection options

#### Returns

`Promise`\<[`PoseDetections`](../type-aliases/PoseDetections.md)\<`K`\>\>

Array of detected people, each with keypoints accessible via the keypoint enum

---

### getAvailableInputSizes()

> **getAvailableInputSizes**: () => readonly `number`[] \| `undefined`

Defined in: [types/poseEstimation.ts:147](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L147)

Returns the available input sizes for multi-method models.
Returns undefined for single-method models.

#### Returns

readonly `number`[] \| `undefined`

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/poseEstimation.ts:125](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L125)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/poseEstimation.ts:120](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L120)

Indicates whether the model is loaded and ready to process images.

---

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`, `options?`) => [`PoseDetections`](../type-aliases/PoseDetections.md)\<`K`\> \| `null`

Defined in: [types/poseEstimation.ts:152](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L152)

Synchronous worklet function for real-time VisionCamera frame processing.
