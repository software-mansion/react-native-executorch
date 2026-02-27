# Interface: SpeechToTextProps

Defined in: [types/stt.ts:8](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L8)

Configuration for Speech to Text model.

## Properties

### model

> **model**: [`SpeechToTextModelConfig`](SpeechToTextModelConfig.md)

Defined in: [types/stt.ts:12](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L12)

Configuration object containing model sources.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/stt.ts:16](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L16)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
