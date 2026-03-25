# Type Alias: ObjectDetectionModelSources

> **ObjectDetectionModelSources** = \{ `modelName`: `"ssdlite-320-mobilenet-v3-large"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"rf-detr-nano"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26n"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26s"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26m"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26l"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \} \| \{ `modelName`: `"yolo26x"`; `modelSource`: [`ResourceSource`](ResourceSource.md); \}

Defined in: [types/objectDetection.ts:56](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/objectDetection.ts#L56)

Per-model config for [ObjectDetectionModule.fromModelName](../classes/ObjectDetectionModule.md#frommodelname).
Each model name maps to its required fields.
