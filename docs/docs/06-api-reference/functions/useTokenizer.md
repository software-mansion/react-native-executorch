# Function: useTokenizer()

> **useTokenizer**(`tokenizerProps`): [`TokenizerType`](../interfaces/TokenizerType.md)

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useTokenizer.ts:15](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/hooks/natural_language_processing/useTokenizer.ts#L15)

React hook for managing a Tokenizer instance.

## Parameters

### tokenizerProps

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
