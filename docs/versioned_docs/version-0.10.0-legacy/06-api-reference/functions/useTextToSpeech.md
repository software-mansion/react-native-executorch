# Function: useTextToSpeech()

> **useTextToSpeech**(`model`, `options?`): [`TextToSpeechType`](../interfaces/TextToSpeechType.md)

Defined in: [hooks/natural_language_processing/useTextToSpeech.ts:20](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/hooks/natural_language_processing/useTextToSpeech.ts#L20)

React hook for managing Text to Speech instance.

## Parameters

### model

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

Configuration object containing model config.

### options?

Additional options for the hook.

#### preventLoad?

`boolean` = `false`

If true, prevents the model from loading automatically on initialization.

## Returns

[`TextToSpeechType`](../interfaces/TextToSpeechType.md)

Ready to use Text to Speech model.
