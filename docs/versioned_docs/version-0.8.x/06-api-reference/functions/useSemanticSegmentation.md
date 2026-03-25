# Function: useSemanticSegmentation()

> **useSemanticSegmentation**\<`C`\>(`props`): [`SemanticSegmentationType`](../interfaces/SemanticSegmentationType.md)\<[`SegmentationLabels`](../type-aliases/SegmentationLabels.md)\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

Defined in: [hooks/computer\_vision/useSemanticSegmentation.ts:27](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/hooks/computer_vision/useSemanticSegmentation.ts#L27)

React hook for managing a Semantic Segmentation model instance.

## Type Parameters

### C

`C` *extends* [`SemanticSegmentationModelSources`](../type-aliases/SemanticSegmentationModelSources.md)

A [SemanticSegmentationModelSources](../type-aliases/SemanticSegmentationModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`SemanticSegmentationProps`](../interfaces/SemanticSegmentationProps.md)\<`C`\>

Configuration object containing `model` config and optional `preventLoad` flag.

## Returns

[`SemanticSegmentationType`](../interfaces/SemanticSegmentationType.md)\<[`SegmentationLabels`](../type-aliases/SegmentationLabels.md)\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function.

## Example

```ts
const { isReady, forward } = useSemanticSegmentation({
  model: { modelName: 'deeplab-v3-resnet50', modelSource: DEEPLAB_V3_RESNET50 },
});
```
