# Type Alias: Tokenizer

> **Tokenizer** = `object`

Defined in: [extensions/nlp/tokenizer.ts:14](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L14)

A native HuggingFace-compatible tokenizer instance backed by a JSI host
object. All methods are synchronous and worklet-compatible.

## Properties

### path

> `readonly` **path**: `string`

Defined in: [extensions/nlp/tokenizer.ts:16](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L16)

Absolute local file path of the loaded `tokenizer.json`.

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens?`): `string`

Defined in: [extensions/nlp/tokenizer.ts:38](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L38)

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

Defined in: [extensions/nlp/tokenizer.ts:74](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L74)

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

Defined in: [extensions/nlp/tokenizer.ts:27](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L27)

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

Defined in: [extensions/nlp/tokenizer.ts:46](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L46)

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

Defined in: [extensions/nlp/tokenizer.ts:56](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L56)

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

Defined in: [extensions/nlp/tokenizer.ts:66](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tokenizer.ts#L66)

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
