# Interface: TextToSpeechModelConfig

Defined in: [types/tts.ts:74](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L74)

Configuration for a specific model and voice in a Text-to-Speech module.

## Properties

### model

> **model**: [`TextToSpeechModelSources`](../type-aliases/TextToSpeechModelSources.md)

Defined in: [types/tts.ts:75](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L75)

The model sources and identifiers.

---

### phonemizerConfig

> **phonemizerConfig**: [`TextToSpeechPhonemizerConfig`](TextToSpeechPhonemizerConfig.md)

Defined in: [types/tts.ts:77](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L77)

The phonemizer configuration to be used with this voice.

---

### voiceSource

> **voiceSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:76](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L76)

The resource containing the voice-specific tensor stored in a binary format.
