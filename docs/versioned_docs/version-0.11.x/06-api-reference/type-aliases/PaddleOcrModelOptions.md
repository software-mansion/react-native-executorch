# Type Alias: PaddleOcrModelOptions

> **PaddleOcrModelOptions** = `object`

Defined in: [extensions/cv/tasks/paddleOcr.ts:66](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L66)

Options for the PP-OCRv6 pipeline.

## Properties

### defaultConfidenceThreshold

> `readonly` **defaultConfidenceThreshold**: `number`

Defined in: [extensions/cv/tasks/paddleOcr.ts:71](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L71)

Drop detections whose confidence falls below this, unless a call overrides
it.
