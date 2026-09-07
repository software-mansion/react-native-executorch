# Function: usePoseEstimation()

> **usePoseEstimation**\<`C`\>(`props`): [`PoseEstimationType`](../interfaces/PoseEstimationType.md)\<[`PoseEstimationKeypoints`](../type-aliases/PoseEstimationKeypoints.md)\<`C`\[`"modelName"`\]\>\>

Defined in: [hooks/computer_vision/usePoseEstimation.ts:21](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/hooks/computer_vision/usePoseEstimation.ts#L21)

React hook for managing a Pose Estimation model instance.

## Type Parameters

### C

`C` _extends_ [`PoseEstimationModelSources`](../type-aliases/PoseEstimationModelSources.md)

A [PoseEstimationModelSources](../type-aliases/PoseEstimationModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`PoseEstimationProps`](../interfaces/PoseEstimationProps.md)\<`C`\>

Configuration object containing `model` config and optional `preventLoad` flag.

## Returns

[`PoseEstimationType`](../interfaces/PoseEstimationType.md)\<[`PoseEstimationKeypoints`](../type-aliases/PoseEstimationKeypoints.md)\<`C`\[`"modelName"`\]\>\>

An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and typed `forward` and `runOnFrame` functions.
