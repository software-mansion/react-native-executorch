# Function: useTextToSpeech()

> **useTextToSpeech**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts:15](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts#L15)

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
