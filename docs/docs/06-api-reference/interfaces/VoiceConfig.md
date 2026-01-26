# Interface: VoiceConfig

Defined in: [packages/react-native-executorch/src/types/tts.ts:18](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L18)

Voice configuration

So far in Kokoro, each voice is directly associated with a language.

## Properties

### extra?

> `optional` **extra**: [`KokoroVoiceExtras`](KokoroVoiceExtras.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:21](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L21)

an optional extra sources or properties related to specific voice

***

### lang

> **lang**: [`TextToSpeechLanguage`](../type-aliases/TextToSpeechLanguage.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:19](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L19)

speaker's language

***

### voiceSource

> **voiceSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:20](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L20)

a source to a binary file with voice embedding
