# Type Alias: ClassificationModelSources

> **ClassificationModelSources** = \{ `modelName`: `"efficientnet-v2-s"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"efficientnet-v2-s-quantized"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [types/classification.ts:25](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L25)

Per-model config for [ClassificationModule.fromModelName](../classes/ClassificationModule.md#frommodelname).
Each model name maps to its required fields.
