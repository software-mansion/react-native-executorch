# Interface: KokoroConfig

Defined in: [types/tts.ts:46](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L46)

Kokoro model configuration.
Only the core Kokoro model sources, as phonemizer sources are included in voice configuration.

## Properties

### durationPredictorSource

> **durationPredictorSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:48](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L48)

source to Kokoro's duration predictor model binary

---

### synthesizerSource

> **synthesizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:49](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L49)

source to Kokoro's synthesizer model binary

---

### type

> **type**: `"kokoro"`

Defined in: [types/tts.ts:47](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L47)

model type identifier
