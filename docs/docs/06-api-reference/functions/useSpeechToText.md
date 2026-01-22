# Function: useSpeechToText()

> **useSpeechToText**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useSpeechToText.ts:7](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/hooks/natural_language_processing/useSpeechToText.ts#L7)

## Parameters

### \_\_namedParameters

#### model

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

#### preventLoad?

`boolean` = `false`

## Returns

`object`

### committedTranscription

> **committedTranscription**: `string`

### decode()

> **decode**: (...`args`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

#### Parameters

##### args

...\[`number`[] \| `Int32Array`\<`ArrayBufferLike`\>, `number`[] \| `Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

### downloadProgress

> **downloadProgress**: `number`

### encode()

> **encode**: (...`args`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

#### Parameters

##### args

...\[`number`[] \| `Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

### isGenerating

> **isGenerating**: `boolean`

### isReady

> **isReady**: `boolean`

### nonCommittedTranscription

> **nonCommittedTranscription**: `string`

### stream()

> **stream**: (`options?`) => `Promise`\<`string`\>

#### Parameters

##### options?

[`DecodingOptions`](../interfaces/DecodingOptions.md)

#### Returns

`Promise`\<`string`\>

### streamInsert()

> **streamInsert**: (...`args`) => `void`

#### Parameters

##### args

...\[`number`[] \| `Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`void`

### streamStop()

> **streamStop**: (...`args`) => `void`

#### Parameters

##### args

...\[\]

#### Returns

`void`

### transcribe()

> **transcribe**: (...`args`) => `Promise`\<`string`\>

#### Parameters

##### args

...\[`number`[] \| `Float32Array`\<`ArrayBufferLike`\>, [`DecodingOptions`](../interfaces/DecodingOptions.md)\]

#### Returns

`Promise`\<`string`\>
