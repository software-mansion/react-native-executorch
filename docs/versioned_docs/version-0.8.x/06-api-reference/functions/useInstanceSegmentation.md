# Function: useInstanceSegmentation()

> **useInstanceSegmentation**\<`C`\>(`props`): [`InstanceSegmentationType`](../interfaces/InstanceSegmentationType.md)\<[`InstanceSegmentationLabels`](../type-aliases/InstanceSegmentationLabels.md)\<`C`\[`"modelName"`\]\>\>

Defined in: [hooks/computer\_vision/useInstanceSegmentation.ts:38](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/hooks/computer_vision/useInstanceSegmentation.ts#L38)

React hook for managing an Instance Segmentation model instance.

## Type Parameters

### C

`C` *extends* [`InstanceSegmentationModelSources`](../type-aliases/InstanceSegmentationModelSources.md)

A [InstanceSegmentationModelSources](../type-aliases/InstanceSegmentationModelSources.md) config specifying which model to load.

## Parameters

### props

[`InstanceSegmentationProps`](../interfaces/InstanceSegmentationProps.md)\<`C`\>

Configuration object containing `model` config and optional `preventLoad` flag.

## Returns

[`InstanceSegmentationType`](../interfaces/InstanceSegmentationType.md)\<[`InstanceSegmentationLabels`](../type-aliases/InstanceSegmentationLabels.md)\<`C`\[`"modelName"`\]\>\>

An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`), a typed `forward` function, `getAvailableInputSizes` helper, and a `runOnFrame` worklet for VisionCamera integration.

## Example

```ts
const { isReady, isGenerating, forward, error, downloadProgress, getAvailableInputSizes, runOnFrame } =
  useInstanceSegmentation({
    model: {
      modelName: 'yolo26n-seg',
      modelSource: 'https://huggingface.co/.../yolo26n-seg.pte',
    },
  });

if (!isReady) {
  return <Text>Loading: {(downloadProgress * 100).toFixed(0)}%</Text>;
}

const results = await forward('path/to/image.jpg', {
  confidenceThreshold: 0.5,
  inputSize: 640,
});
```
