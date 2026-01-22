# Function: useTokenizer()

> **useTokenizer**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTokenizer.ts:7](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useTokenizer.ts#L7)

## Parameters

### \_\_namedParameters

#### preventLoad?

`boolean` = `false`

#### tokenizer

\{ `tokenizerSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); \}

#### tokenizer.tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

## Returns

`object`

### decode()

> **decode**: (...`args`) => `Promise`\<`Promise`\<`any`\>\>

#### Parameters

##### args

...\[`number`[], `boolean`\]

#### Returns

`Promise`\<`Promise`\<`any`\>\>

### downloadProgress

> **downloadProgress**: `number`

### encode()

> **encode**: (...`args`) => `Promise`\<`Promise`\<`any`\>\>

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`Promise`\<`any`\>\>

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

### getVocabSize()

> **getVocabSize**: (...`args`) => `Promise`\<`Promise`\<`number`\>\>

#### Parameters

##### args

...\[\]

#### Returns

`Promise`\<`Promise`\<`number`\>\>

### idToToken()

> **idToToken**: (...`args`) => `Promise`\<`Promise`\<`string`\>\>

#### Parameters

##### args

...\[`number`\]

#### Returns

`Promise`\<`Promise`\<`string`\>\>

### isGenerating

> **isGenerating**: `boolean`

### isReady

> **isReady**: `boolean`

### tokenToId()

> **tokenToId**: (...`args`) => `Promise`\<`Promise`\<`number`\>\>

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`Promise`\<`number`\>\>
