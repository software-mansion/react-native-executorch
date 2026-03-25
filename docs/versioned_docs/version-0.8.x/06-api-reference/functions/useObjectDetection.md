# Function: useObjectDetection()

> **useObjectDetection**\<`C`\>(`props`): [`ObjectDetectionType`](../interfaces/ObjectDetectionType.md)\<[`ObjectDetectionLabels`](../type-aliases/ObjectDetectionLabels.md)\<`C`\[`"modelName"`\]\>\>

Defined in: [hooks/computer\_vision/useObjectDetection.ts:21](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/hooks/computer_vision/useObjectDetection.ts#L21)

React hook for managing an Object Detection model instance.

## Type Parameters

### C

`C` *extends* [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`ObjectDetectionProps`](../interfaces/ObjectDetectionProps.md)\<`C`\>

Configuration object containing `model` config and optional `preventLoad` flag.

## Returns

[`ObjectDetectionType`](../interfaces/ObjectDetectionType.md)\<[`ObjectDetectionLabels`](../type-aliases/ObjectDetectionLabels.md)\<`C`\[`"modelName"`\]\>\>

An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and typed `forward` and `runOnFrame` functions.
