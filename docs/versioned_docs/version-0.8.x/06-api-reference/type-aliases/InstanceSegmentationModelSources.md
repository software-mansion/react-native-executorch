# Type Alias: InstanceSegmentationModelSources

> **InstanceSegmentationModelSources** = \{ `modelName`: `"yolo26n-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26s-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26m-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26l-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26x-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"rfdetr-nano-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [types/instanceSegmentation.ts:111](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L111)

Per-model config for [InstanceSegmentationModule.fromModelName](../classes/InstanceSegmentationModule.md#frommodelname).
Each model name maps to its required fields.
