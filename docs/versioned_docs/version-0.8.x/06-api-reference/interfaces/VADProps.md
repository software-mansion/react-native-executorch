# Interface: VADProps

Defined in: [types/vad.ts:18](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L18)

Props for the useVAD hook.

## Properties

### model

> **model**: `object`

Defined in: [types/vad.ts:19](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L19)

An object containing the model configuration.

#### modelName

> **modelName**: `"fsmn-vad"`

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/vad.ts:20](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L20)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
