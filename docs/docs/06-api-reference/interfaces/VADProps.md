# Interface: VADProps

Defined in: [packages/react-native-executorch/src/types/vad.ts:7](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L7)

Props for the useVAD hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/vad.ts:11](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L11)

`ResourceSource` that specifies the location of the VAD model binary.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:16](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L16)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
