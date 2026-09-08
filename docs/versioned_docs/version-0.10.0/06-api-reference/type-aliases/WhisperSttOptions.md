# Type Alias: WhisperSttOptions\<L\>

> **WhisperSttOptions**\<`L`\> = `object`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:65](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L65)

Options passed to a single transcription call.

## Type Parameters

### L

`L` _extends_ [`WhisperLanguage`](WhisperLanguage.md) = [`WhisperLanguage`](WhisperLanguage.md)

## Properties

### language

> `readonly` **language**: `L`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:71](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L71)

Whisper language code of the spoken audio. Must be one of
the [WhisperLanguage](WhisperLanguage.md) values declared in the model's
`supportedLanguages` list.
