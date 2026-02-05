# Interface: VADProps

Defined in: [packages/react-native-executorch/src/types/vad.ts:12](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/vad.ts#L12)

Props for the useVAD hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/vad.ts:13](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/vad.ts#L13)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:14](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/types/vad.ts#L14)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
