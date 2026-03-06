# Interface: VADProps

Defined in: [types/vad.ts:20](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L20)

Props for the useVAD hook.

## Properties

### model

> **model**: `object`

Defined in: [types/vad.ts:21](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L21)

An object containing the model configuration.

#### modelName

> **modelName**: `"fsmn-vad"`

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/vad.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L22)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
