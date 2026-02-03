# Interface: KokoroConfig

Defined in: [packages/react-native-executorch/src/types/tts.ts:50](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L50)

Kokoro model configuration.
Only the core Kokoro model sources, as phonemizer sources are included in voice configuration.

## Properties

### durationPredictorSource

> **durationPredictorSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:52](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L52)

source to Kokoro's duration predictor model binary

---

### synthesizerSource

> **synthesizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:53](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L53)

source to Kokoro's synthesizer model binary

---

### type

> **type**: `"kokoro"`

Defined in: [packages/react-native-executorch/src/types/tts.ts:51](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L51)

model type identifier
