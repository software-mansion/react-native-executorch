# Type Alias: PaddleOcrModelOptions

> **PaddleOcrModelOptions** = `object`

Defined in: [extensions/cv/tasks/paddleOcr.ts:66](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L66)

Options for the PP-OCRv6 pipeline.

## Properties

### defaultConfidenceThreshold

> `readonly` **defaultConfidenceThreshold**: `number`

Defined in: [extensions/cv/tasks/paddleOcr.ts:71](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L71)

Drop detections whose confidence falls below this, unless a call overrides
it.
