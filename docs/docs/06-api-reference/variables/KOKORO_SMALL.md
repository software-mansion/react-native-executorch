# Variable: KOKORO\_SMALL

> `const` **KOKORO\_SMALL**: `object`

Defined in: [packages/react-native-executorch/src/constants/tts/models.ts:13](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/constants/tts/models.ts#L13)

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
