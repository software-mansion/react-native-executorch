# Type Alias: ModelSources

> **ModelSources** = \{ `modelName`: `"deeplab-v3"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"selfie-segmentation"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"rfdetr"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:27](https://github.com/software-mansion/react-native-executorch/blob/ec04754e2ea2ad38fe30c36a9250db47f020a06e/packages/react-native-executorch/src/types/imageSegmentation.ts#L27)

Per-model config for [ImageSegmentationModule.fromModelName](../classes/ImageSegmentationModule.md#frommodelname).
Each model name maps to its required fields.
Add new union members here when a model needs extra sources or options.
