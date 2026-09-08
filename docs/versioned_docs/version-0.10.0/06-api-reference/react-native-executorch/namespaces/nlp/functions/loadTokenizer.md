# Function: loadTokenizer()

> **loadTokenizer**(`tokenizerPath`): [`Tokenizer`](../type-aliases/Tokenizer.md)

Defined in: [extensions/nlp/tokenizer.ts:91](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L91)

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
