# Type Alias: ModelSources

> **ModelSources** = \{ `modelName`: `"deeplab-v3"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"selfie-segmentation"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [types/imageSegmentation.ts:24](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L24)

Per-model config for [ImageSegmentationModule.fromModelName](../classes/ImageSegmentationModule.md#frommodelname).
Each model name maps to its required fields.
Add new union members here when a model needs extra sources or options.
