# Interface: TokenizerProps

Defined in: [types/tokenizer.ts:8](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tokenizer.ts#L8)

Parameters for initializing and configuring a Tokenizer instance.

## Properties

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/tokenizer.ts:19](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tokenizer.ts#L19)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

***

### tokenizer

> **tokenizer**: `object`

Defined in: [types/tokenizer.ts:14](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tokenizer.ts#L14)

Object containing:

`tokenizerSource` - A `ResourceSource` that specifies the location of the tokenizer.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)
