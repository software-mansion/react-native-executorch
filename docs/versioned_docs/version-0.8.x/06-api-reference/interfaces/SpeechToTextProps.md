# Interface: SpeechToTextProps

Defined in: [types/stt.ts:23](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L23)

Configuration for Speech to Text model.

## Properties

### model

> **model**: [`SpeechToTextModelConfig`](SpeechToTextModelConfig.md)

Defined in: [types/stt.ts:27](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L27)

Configuration object containing model sources.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/stt.ts:31](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L31)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
