# Interface: SpeechToTextProps

Defined in: [packages/react-native-executorch/src/types/stt.ts:9](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/types/stt.ts#L9)

Configuration for Speech to Text model.

## Properties

### model

> **model**: [`SpeechToTextModelConfig`](SpeechToTextModelConfig.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:13](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/types/stt.ts#L13)

Configuration object containing model sources.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:17](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/types/stt.ts#L17)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
