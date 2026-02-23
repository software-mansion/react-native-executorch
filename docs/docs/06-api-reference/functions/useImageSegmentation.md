# Function: useImageSegmentation()

> **useImageSegmentation**\<`C`\>(`props`): [`ImageSegmentationType`](../interfaces/ImageSegmentationType.md)\<[`SegmentationLabels`](../type-aliases/SegmentationLabels.md)\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

Defined in: [packages/react-native-executorch/src/hooks/computer_vision/useImageSegmentation.ts:31](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/hooks/computer_vision/useImageSegmentation.ts#L31)

React hook for managing an Image Segmentation model instance.

## Type Parameters

### C

`C` _extends_ [`ModelSources`](../type-aliases/ModelSources.md)

A [ModelSources](../type-aliases/ModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`ImageSegmentationProps`](../interfaces/ImageSegmentationProps.md)\<`C`\>

Configuration object containing `model` config and optional `preventLoad` flag.

## Returns

[`ImageSegmentationType`](../interfaces/ImageSegmentationType.md)\<[`SegmentationLabels`](../type-aliases/SegmentationLabels.md)\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function.

## Example

```ts
const { isReady, forward } = useImageSegmentation({
  model: { modelName: 'deeplab-v3', modelSource: DEEPLAB_V3_RESNET50 },
});
```
