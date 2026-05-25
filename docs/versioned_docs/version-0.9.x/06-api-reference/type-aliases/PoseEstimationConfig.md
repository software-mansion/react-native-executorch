# Type Alias: PoseEstimationConfig\<K\>

> **PoseEstimationConfig**\<`K`\> = `object` & \{ `availableInputSizes`: readonly `number`[]; `defaultInputSize`: `number`; \} \| \{ `availableInputSizes?`: `undefined`; `defaultInputSize?`: `undefined`; \}

Defined in: [types/poseEstimation.ts:41](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L41)

Configuration for pose estimation model behavior.

## Type Declaration

### defaultDetectionThreshold?

> `optional` **defaultDetectionThreshold**: `number`

### defaultKeypointThreshold?

> `optional` **defaultKeypointThreshold**: `number`

### keypointMap

> **keypointMap**: `K`

### preprocessorConfig?

> `optional` **preprocessorConfig**: `object`

#### preprocessorConfig.normMean?

> `optional` **normMean**: readonly \[`number`, `number`, `number`\]

#### preprocessorConfig.normStd?

> `optional` **normStd**: readonly \[`number`, `number`, `number`\]

## Type Parameters

### K

`K` _extends_ [`LabelEnum`](LabelEnum.md)

The keypoint enum type for this model.
