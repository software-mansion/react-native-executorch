# Interface: KokoroConfig

Defined in: [types/tts.ts:52](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L52)

Kokoro model configuration.
Only the core Kokoro model sources, as phonemizer sources are included in voice configuration.

## Properties

### durationPredictorSource

> **durationPredictorSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:54](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L54)

source to Kokoro's duration predictor model binary

***

### modelName

> **modelName**: [`TextToSpeechModelName`](../type-aliases/TextToSpeechModelName.md)

Defined in: [types/tts.ts:53](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L53)

model name identifier

***

### synthesizerSource

> **synthesizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:55](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L55)

source to Kokoro's synthesizer model binary
