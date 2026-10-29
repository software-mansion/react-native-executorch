# Type Alias: InstanceSegmentationModelSources

> **InstanceSegmentationModelSources** = \{ `modelName`: `"yolo26n-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26s-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26m-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26l-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26x-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"rfdetr-nano-seg"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"fastsam-s"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"fastsam-x"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [types/instanceSegmentation.ts:111](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L111)

Per-model config for [InstanceSegmentationModule.fromModelName](../classes/InstanceSegmentationModule.md#frommodelname).
Each model name maps to its required fields.
