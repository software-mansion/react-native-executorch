# Type Alias: WhisperSttModel\<L\>

> **WhisperSttModel**\<`L`\> = `object`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:92](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L92)

Paths and metadata required to instantiate a Whisper speech-to-text model.

## Type Parameters

### L

`L` _extends_ [`WhisperLanguage`](WhisperLanguage.md) = [`WhisperLanguage`](WhisperLanguage.md)

## Properties

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:94](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L94)

Local path or remote URL of the `.pte` model.

---

### supportedLanguages

> `readonly` **supportedLanguages**: readonly `L`[]

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:98](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L98)

List of supported language codes for this model.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:96](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L96)

Local path or remote URL of the tokenizer file.

---

### vadModel

> `readonly` **vadModel**: [`FsmnVadModel`](FsmnVadModel.md)

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:100](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L100)

VAD model configuration used for speech segmentation.
