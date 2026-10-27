# Type Alias: Tokenizer

> **Tokenizer** = `object`

Defined in: [extensions/nlp/tokenizer.ts:14](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L14)

A native HuggingFace-compatible tokenizer instance backed by a JSI host
object. All methods are synchronous and worklet-compatible.

## Properties

### path

> `readonly` **path**: `string`

Defined in: [extensions/nlp/tokenizer.ts:16](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L16)

Absolute local file path of the loaded `tokenizer.json`.

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens?`): `string`

Defined in: [extensions/nlp/tokenizer.ts:38](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L38)

Decodes token ids back into a string.

#### Parameters

##### tokens

`Int32Array`

The token ids to decode (as an `Int32Array`).

##### skipSpecialTokens?

`boolean`

Whether to omit special tokens. Defaults to `true`.

#### Returns

`string`

The decoded text string.

#### Throws

With code `EXECUTION_FAILED` if decoding fails,
`RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED` if
disposed.

---

### dispose()

> **dispose**(): `void`

Defined in: [extensions/nlp/tokenizer.ts:87](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L87)

Releases the native tokenizer resources. The instance must not be used
afterwards.

#### Returns

`void`

#### Throws

With code `RESOURCE_DISPOSED` if the tokenizer
has already been disposed.

---

### encode()

> **encode**(`text`): `Int32Array`

Defined in: [extensions/nlp/tokenizer.ts:27](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L27)

Encodes a string into token ids (special tokens are added according to the
`tokenizer.json` post_processor).

#### Parameters

##### text

`string`

The input text string to tokenize.

#### Returns

`Int32Array`

The encoded token ids as an `Int32Array`.

#### Throws

With code `EXECUTION_FAILED` if tokenization
fails, `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED`
if disposed.

---

### getVocabSize()

> **getVocabSize**(): `number`

Defined in: [extensions/nlp/tokenizer.ts:59](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L59)

Returns the total vocabulary size.

#### Returns

`number`

The total number of tokens in the vocabulary.

#### Throws

With code `RESOURCE_BUSY` if the tokenizer is
in use, or `RESOURCE_DISPOSED` if disposed.

---

### idToToken()

> **idToToken**(`id`): `string`

Defined in: [extensions/nlp/tokenizer.ts:69](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L69)

Converts a numeric token id to its string piece representation.

#### Parameters

##### id

`number`

The token id to look up.

#### Returns

`string`

The string piece for the given token id.

#### Throws

With code `EXECUTION_FAILED` if id lookup
fails, `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED`
if disposed.

---

### tokenToId()

> **tokenToId**(`token`): `number`

Defined in: [extensions/nlp/tokenizer.ts:79](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L79)

Converts a string piece token to its numeric token id.

#### Parameters

##### token

`string`

The token piece string to look up.

#### Returns

`number`

The numeric id for the given token piece.

#### Throws

With code `EXECUTION_FAILED` if token lookup
fails, `RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED`
if disposed.

---

### tryDecode()

> **tryDecode**(`tokens`, `skipSpecialTokens?`): `string` \| `undefined`

Defined in: [extensions/nlp/tokenizer.ts:51](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L51)

Decodes token ids, returning `undefined` if the decoded bytes end in an
incomplete UTF-8 sequence. Retain the ids and retry with additional tokens
until a string is returned. An empty string is a successful decode.

#### Parameters

##### tokens

`Int32Array`

The pending token ids as an `Int32Array`.

##### skipSpecialTokens?

`boolean`

Whether to omit special tokens. Defaults to `true`.

#### Returns

`string` \| `undefined`

Decoded text, or `undefined` when more tokens are needed.

#### Throws

With code `EXECUTION_FAILED` if decoding fails,
`RESOURCE_BUSY` if the tokenizer is in use, or `RESOURCE_DISPOSED` if
disposed.
