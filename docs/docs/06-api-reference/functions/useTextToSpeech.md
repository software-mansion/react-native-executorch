# Function: useTextToSpeech()

> **useTextToSpeech**(`TextToSpeechConfiguration`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useTextToSpeech.ts:22](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts#L22)

React hook for managing Text to Speech instance.

## Parameters

### TextToSpeechConfiguration

`Props`

Configuration object containing `model` source, `voice` and optional `preventLoad`.

## Returns

`object`

Ready to use Text to Speech model.

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

### streamStop()

> **streamStop**: () => `void` = `moduleInstance.streamStop`

#### Returns

`void`
