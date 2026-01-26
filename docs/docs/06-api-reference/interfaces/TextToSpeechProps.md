# Interface: TextToSpeechProps

Defined in: [packages/react-native-executorch/src/types/tts.ts:68](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L68)

Props for the useTextToSpeech hook.

## Extends

- [`TextToSpeechConfig`](TextToSpeechConfig.md)

## Properties

### model

> **model**: [`KokoroConfig`](KokoroConfig.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:57](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L57)

a selected T2S model

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`model`](TextToSpeechConfig.md#model)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tts.ts:69](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L69)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

***

### voice

> **voice**: [`VoiceConfig`](VoiceConfig.md)

Defined in: [packages/react-native-executorch/src/types/tts.ts:58](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/tts.ts#L58)

a selected speaker's voice

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`voice`](TextToSpeechConfig.md#voice)
