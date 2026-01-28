# Function: useTokenizer()

> **useTokenizer**(`tokenizerConfiguration`): [`TokenizerType`](../interfaces/TokenizerType.md)

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useTokenizer.ts:15](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/hooks/natural_language_processing/useTokenizer.ts#L15)

React hook for managing a Tokenizer instance.

## Parameters

### tokenizerConfiguration

Configuration object containing `tokenizer` source and optional `preventLoad` flag.

#### preventLoad?

`boolean` = `false`

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

#### tokenizer

\{ `tokenizerSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); \}

Object containing:

`tokenizerSource` - A `ResourceSource` that specifies the location of the tokenizer.

#### tokenizer.tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

## Returns

[`TokenizerType`](../interfaces/TokenizerType.md)

Ready to use Tokenizer model.
