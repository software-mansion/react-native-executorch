# Function: useSpeechToText()

> **useSpeechToText**(`speechToTextConfiguration`): [`SpeechToTextType`](../interfaces/SpeechToTextType.md)

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useSpeechToText.ts:13](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/hooks/natural_language_processing/useSpeechToText.ts#L13)

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
