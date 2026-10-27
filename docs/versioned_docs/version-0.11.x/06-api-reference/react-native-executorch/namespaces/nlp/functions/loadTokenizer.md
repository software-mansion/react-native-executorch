# Function: loadTokenizer()

> **loadTokenizer**(`tokenizerPath`): [`Tokenizer`](../type-aliases/Tokenizer.md)

Defined in: [extensions/nlp/tokenizer.ts:104](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L104)

Loads a HuggingFace tokenizer from a local `tokenizer.json` file.

## Parameters

### tokenizerPath

`string`

Absolute local path to a `tokenizer.json` file.

## Returns

[`Tokenizer`](../type-aliases/Tokenizer.md)

The loaded native [Tokenizer](../type-aliases/Tokenizer.md) instance.

## Throws

With code `LOAD_FAILED` if the tokenizer file
fails to load or parse.
