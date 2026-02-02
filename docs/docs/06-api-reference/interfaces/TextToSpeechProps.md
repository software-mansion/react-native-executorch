# Interface: TextToSpeechProps

Defined in: [packages/react-native-executorch/src/types/tts.ts:77](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/tts.ts#L77)

Props for the useTextToSpeech hook.

## Extends

- [`TextToSpeechConfig`](TextToSpeechConfig.md)

## Properties

### model

> **model**: [`KokoroConfig`](KokoroConfig.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:65](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/tts.ts#L65)

a selected T2S model

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`model`](TextToSpeechConfig.md#model)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tts.ts:78](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/tts.ts#L78)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

---

### voice

> **voice**: [`VoiceConfig`](VoiceConfig.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:66](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/tts.ts#L66)

a selected speaker's voice

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`voice`](TextToSpeechConfig.md#voice)
