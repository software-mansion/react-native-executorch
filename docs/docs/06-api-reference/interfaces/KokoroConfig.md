# Interface: KokoroConfig

Defined in: [packages/react-native-executorch/src/types/tts.ts:50](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/types/tts.ts#L50)

Kokoro model configuration.
Only the core Kokoro model sources, as phonemizer sources are included in voice configuration.

## Properties

### durationPredictorSource

> **durationPredictorSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:52](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/types/tts.ts#L52)

source to Kokoro's duration predictor model binary

***

### synthesizerSource

> **synthesizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:53](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/types/tts.ts#L53)

source to Kokoro's synthesizer model binary

***

### type

> **type**: `"kokoro"`

Defined in: [packages/react-native-executorch/src/types/tts.ts:51](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/types/tts.ts#L51)

model type identifier
