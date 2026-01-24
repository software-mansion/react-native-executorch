# Variable: KOKORO\_SMALL

> `const` **KOKORO\_SMALL**: `object`

Defined in: [packages/react-native-executorch/src/constants/tts/models.ts:13](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/constants/tts/models.ts#L13)

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
