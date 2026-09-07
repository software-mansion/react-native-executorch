# Interface: SpeechToTextProps

Defined in: [types/stt.ts:21](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L21)

Configuration for Speech to Text model.

## Properties

### model

> **model**: [`SpeechToTextModelConfig`](SpeechToTextModelConfig.md)

Defined in: [types/stt.ts:25](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L25)

Configuration object containing model sources.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/stt.ts:33](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L33)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

---

### vad?

> `optional` **vad**: [`VADConfig`](VADConfig.md)

Defined in: [types/stt.ts:29](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L29)

An optional VAD model to be utilized to enhance speech-to-text streaming capabilities.
