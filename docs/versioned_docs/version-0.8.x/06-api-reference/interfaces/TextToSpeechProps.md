# Interface: TextToSpeechProps

Defined in: [types/tts.ts:76](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L76)

Props for the useTextToSpeech hook.

## Extends

- [`TextToSpeechConfig`](TextToSpeechConfig.md)

## Properties

### model

> **model**: [`KokoroConfig`](KokoroConfig.md)

Defined in: [types/tts.ts:66](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L66)

a selected T2S model

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`model`](TextToSpeechConfig.md#model)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/tts.ts:77](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L77)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

***

### voice

> **voice**: [`VoiceConfig`](VoiceConfig.md)

Defined in: [types/tts.ts:67](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L67)

a selected speaker's voice

#### Inherited from

[`TextToSpeechConfig`](TextToSpeechConfig.md).[`voice`](TextToSpeechConfig.md#voice)
