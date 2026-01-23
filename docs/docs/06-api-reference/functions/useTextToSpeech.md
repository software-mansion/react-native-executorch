# Function: useTextToSpeech()

> **useTextToSpeech**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useTextToSpeech.ts:15](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts#L15)

## Parameters

### \_\_namedParameters

`Props`

## Returns

`object`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

### forward()

> **forward**: (`input`) => `Promise`\<`any`\>

#### Parameters

##### input

[`TextToSpeechInput`](../interfaces/TextToSpeechInput.md)

#### Returns

`Promise`\<`any`\>

### isGenerating

> **isGenerating**: `boolean`

### isReady

> **isReady**: `boolean`

### stream()

> **stream**: (`input`) => `Promise`\<`void`\>

#### Parameters

##### input

[`TextToSpeechStreamingInput`](../interfaces/TextToSpeechStreamingInput.md)

#### Returns

`Promise`\<`void`\>
