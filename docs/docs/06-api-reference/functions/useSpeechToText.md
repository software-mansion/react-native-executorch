# Function: useSpeechToText()

> **useSpeechToText**(`speechToTextConfiguration`): [`SpeechToTextType`](../interfaces/SpeechToTextType.md)

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useSpeechToText.ts:14](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/hooks/natural_language_processing/useSpeechToText.ts#L14)

React hook for managing a Speech to Text (STT) instance.

## Parameters

### speechToTextConfiguration

Configuration object containing `model` source and optional `preventLoad` flag.

#### model

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

Object containing:

`isMultilingual` - A boolean flag indicating whether the model supports multiple languages.

`encoderSource` - A string that specifies the location of a `.pte` file for the encoder.

`decoderSource` - A string that specifies the location of a `.pte` file for the decoder.

`tokenizerSource` - A string that specifies the location to the tokenizer for the model.

#### preventLoad?

`boolean` = `false`

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

## Returns

[`SpeechToTextType`](../interfaces/SpeechToTextType.md)

Ready to use Speech to Text model.
