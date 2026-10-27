# Type Alias: RecognizeCharactersOptions

> **RecognizeCharactersOptions** = `object`

Defined in: [extensions/cv/tasks/paddleOcr.ts:78](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L78)

Optional configuration parameters for optical character recognition inference.

## Properties

### confidenceThreshold?

> `readonly` `optional` **confidenceThreshold**: `number`

Defined in: [extensions/cv/tasks/paddleOcr.ts:83](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L83)

Minimum confidence threshold to retain recognized text regions, in `[0, 1]`.
Overrides the model's `defaultConfidenceThreshold` for this call.
