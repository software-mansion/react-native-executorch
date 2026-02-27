# Interface: TextToSpeechProps

Defined in: [types/tts.ts:70](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L70)

Props for the useTextToSpeech hook.

## Extends

- [`TextToSpeechConfig`](TextToSpeechConfig.md)

## Properties

### model

> **model**: [`KokoroConfig`](KokoroConfig.md)

Defined in: [types/tts.ts:60](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L60)

a selected T2S model

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`model`](TextToSpeechConfig.md#model)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/tts.ts:71](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L71)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

---

### voice

> **voice**: [`VoiceConfig`](VoiceConfig.md)

Defined in: [types/tts.ts:61](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L61)

a selected speaker's voice

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`voice`](TextToSpeechConfig.md#voice)
