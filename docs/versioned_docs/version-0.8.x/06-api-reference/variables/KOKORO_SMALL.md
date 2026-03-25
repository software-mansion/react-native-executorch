# Variable: KOKORO\_SMALL

> `const` **KOKORO\_SMALL**: `object`

Defined in: [constants/tts/models.ts:14](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/tts/models.ts#L14)

A Kokoro model instance which processes the text in batches of maximum 64 tokens.
Uses significant less memory than the medium model, but could produce
a lower quality speech due to forced, aggressive text splitting.

## Type Declaration

### durationPredictorSource

> **durationPredictorSource**: `string`

### modelName

> **modelName**: `"kokoro-small"`

### synthesizerSource

> **synthesizerSource**: `string`
