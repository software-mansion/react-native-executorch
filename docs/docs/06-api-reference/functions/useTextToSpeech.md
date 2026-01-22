# Function: useTextToSpeech()

> **useTextToSpeech**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts:15](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts#L15)

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

`TextToSpeechInput`

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

`TextToSpeechStreamingInput`

#### Returns

`Promise`\<`void`\>
