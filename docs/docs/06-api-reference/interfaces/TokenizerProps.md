# Interface: TokenizerProps

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:9](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/tokenizer.ts#L9)

Parameters for initializing and configuring a Tokenizer instance.

## Properties

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:20](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/tokenizer.ts#L20)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

***

### tokenizer

> **tokenizer**: `object`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:15](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/tokenizer.ts#L15)

Object containing:

`tokenizerSource` - A `ResourceSource` that specifies the location of the tokenizer.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)
