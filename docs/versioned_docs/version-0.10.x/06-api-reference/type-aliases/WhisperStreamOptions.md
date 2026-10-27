# Type Alias: WhisperStreamOptions\<L\>

> **WhisperStreamOptions**\<`L`\> = [`WhisperSttOptions`](WhisperSttOptions.md)\<`L`\> & `object`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:79](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L79)

Options for the live-streaming transcription API.
Extends [WhisperSttOptions](WhisperSttOptions.md) with optional VAD tuning.

## Type Declaration

### vadOptions?

> `readonly` `optional` **vadOptions**: [`VadStreamOptions`](VadStreamOptions.md)

Fine-tuning knobs forwarded to the voice-activity detector. Omit to use
built-in defaults.

## Type Parameters

### L

`L` _extends_ [`WhisperLanguage`](WhisperLanguage.md) = [`WhisperLanguage`](WhisperLanguage.md)
