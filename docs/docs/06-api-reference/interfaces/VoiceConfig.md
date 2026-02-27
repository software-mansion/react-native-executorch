# Interface: VoiceConfig

Defined in: [types/tts.ts:21](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L21)

Voice configuration

So far in Kokoro, each voice is directly associated with a language.

## Properties

### extra?

> `optional` **extra**: [`KokoroVoiceExtras`](KokoroVoiceExtras.md)

Defined in: [types/tts.ts:24](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L24)

an optional extra sources or properties related to specific voice

---

### lang

> **lang**: [`TextToSpeechLanguage`](../type-aliases/TextToSpeechLanguage.md)

Defined in: [types/tts.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L22)

speaker's language

---

### voiceSource

> **voiceSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:23](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L23)

a source to a binary file with voice embedding
