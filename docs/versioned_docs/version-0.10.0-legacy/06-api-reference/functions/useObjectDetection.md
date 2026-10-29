# Function: useObjectDetection()

> **useObjectDetection**\<`C`\>(`props`): [`ObjectDetectionType`](../interfaces/ObjectDetectionType.md)\<[`ObjectDetectionLabels`](../type-aliases/ObjectDetectionLabels.md)\<`C`\[`"modelName"`\]\>\>

Defined in: [hooks/computer_vision/useObjectDetection.ts:21](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/hooks/computer_vision/useObjectDetection.ts#L21)

React hook for managing an Object Detection model instance.

## Type Parameters

### C

`C` _extends_ [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`ObjectDetectionProps`](../interfaces/ObjectDetectionProps.md)\<`C`\>

Configuration object containing `model` config and optional `preventLoad` flag.

## Returns

[`ObjectDetectionType`](../interfaces/ObjectDetectionType.md)\<[`ObjectDetectionLabels`](../type-aliases/ObjectDetectionLabels.md)\<`C`\[`"modelName"`\]\>\>

An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and typed `forward` and `runOnFrame` functions.
