# Interface: VoiceConfig

Defined in: [packages/react-native-executorch/src/types/tts.ts:23](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/tts.ts#L23)

Voice configuration

So far in Kokoro, each voice is directly associated with a language.

## Properties

### extra?

> `optional` **extra**: [`KokoroVoiceExtras`](KokoroVoiceExtras.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:26](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/tts.ts#L26)

an optional extra sources or properties related to specific voice

***

### lang

> **lang**: [`TextToSpeechLanguage`](../type-aliases/TextToSpeechLanguage.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:24](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/tts.ts#L24)

speaker's language

***

### voiceSource

> **voiceSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:25](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/tts.ts#L25)

a source to a binary file with voice embedding
