# Type Alias: WhisperSttOptions\<L\>

> **WhisperSttOptions**\<`L`\> = `object`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:65](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L65)

Options passed to a single transcription call.

## Type Parameters

### L

`L` _extends_ [`WhisperLanguage`](WhisperLanguage.md) = [`WhisperLanguage`](WhisperLanguage.md)

## Properties

### language

> `readonly` **language**: `L`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:71](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L71)

Whisper language code of the spoken audio. Must be one of
the [WhisperLanguage](WhisperLanguage.md) values declared in the model's
`supportedLanguages` list.
