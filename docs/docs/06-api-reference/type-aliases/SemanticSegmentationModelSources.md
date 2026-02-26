# Type Alias: SemanticSegmentationModelSources

> **SemanticSegmentationModelSources** = \{ `modelName`: `"deeplab-v3"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"selfie-segmentation"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [types/semanticSegmentation.ts:27](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L27)

Per-model config for [SemanticSegmentationModule.fromModelName](../classes/SemanticSegmentationModule.md#frommodelname).
Each model name maps to its required fields.
Add new union members here when a model needs extra sources or options.
