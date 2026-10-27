# Function: useTokenizer()

> **useTokenizer**(`tokenizerPath`, `options?`): `object`

Defined in: [hooks/useTokenizer.ts:21](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useTokenizer.ts#L21)

React hook to load and run a tokenizer.

This hook manages downloading (if remote URLs are provided) and loading the
tokenizer configuration files, tracking download progress and load errors,
and releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createTokenizer](createTokenizer.md).

## Parameters

### tokenizerPath

`string`

A remote URL or local path to a `tokenizer.json` file.

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [nlp.Tokenizer](../react-native-executorch/namespaces/nlp/type-aliases/Tokenizer.md) (without `dispose`),
combined with loading state and download progress.

### decode

> **decode**: (...`args`) => `Promise`\<`string`\> \| `undefined` = `model.decode`

### downloadProgress

> **downloadProgress**: `number`

### encode

> **encode**: (...`args`) => `Promise`\<`Int32Array`\<`ArrayBufferLike`\>\> \| `undefined` = `model.encode`

### error

> **error**: `Error` \| `undefined`

### getVocabSize

> **getVocabSize**: () => `number` \| `undefined` = `model.getVocabSize`

#### Type Declaration

() => `number`

Returns the total vocabulary size.

#### Returns

`number`

The total number of tokens in the vocabulary.

#### Throws

With code `RESOURCE_BUSY` if the tokenizer is
in use, or `RESOURCE_DISPOSED` if disposed.

`undefined`

### idToToken

> **idToToken**: (`id`) => `string` \| `undefined` = `model.idToToken`

#### Type Declaration

(`id`) => `string`

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

`undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: `string` \| `undefined`

### tokenToId

> **tokenToId**: (`token`) => `number` \| `undefined` = `model.tokenToId`

#### Type Declaration

(`token`) => `number`

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

`undefined`

## See

[nlp.Tokenizer](../react-native-executorch/namespaces/nlp/type-aliases/Tokenizer.md)
