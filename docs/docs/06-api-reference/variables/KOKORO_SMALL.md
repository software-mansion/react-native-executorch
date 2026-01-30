# Variable: KOKORO\_SMALL

> `const` **KOKORO\_SMALL**: `object`

Defined in: [packages/react-native-executorch/src/constants/tts/models.ts:15](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/constants/tts/models.ts#L15)

A Kokoro model instance which processes the text in batches of maximum 64 tokens.
Uses significant less memory than the medium model, but could produce
a lower quality speech due to forced, aggressive text splitting.

## Type Declaration

### durationPredictorSource

> **durationPredictorSource**: `string`

### synthesizerSource

> **synthesizerSource**: `string`

### type

> **type**: `"kokoro"`
