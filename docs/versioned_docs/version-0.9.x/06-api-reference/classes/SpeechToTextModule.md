# Class: SpeechToTextModule

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L19)

Module for Speech to Text (STT) functionalities.

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:152](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L152)

Runs the decoder of the model.

#### Parameters

##### tokens

`Int32Array`

The input tokens.

##### encoderOutput

`Float32Array`

The encoder output.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Decoded output.

---

### delete()

> **delete**(): `void`

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:131](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L131)

Unloads the model from memory.

#### Returns

`void`

---

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:141](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L141)

Runs the encoding part of the model on the provided waveform.
Returns the encoded waveform as a Float32Array.

#### Parameters

##### waveform

`Float32Array`

The input audio waveform.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

The encoded output.

---

### stream()

> **stream**(`options?`): `AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); \}\>

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:192](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L192)

Starts a streaming transcription session.
Yields objects with `committed` and `nonCommitted` transcriptions.
Committed transcription contains the part of the transcription that is finalized and will not change.
Useful for displaying stable results during streaming.
Non-committed transcription contains the part of the transcription that is still being processed and may change.
Useful for displaying live, partial results during streaming.
Use with `streamInsert` and `streamStop` to control the stream.

#### Parameters

##### options?

[`StreamingOptions`](../interfaces/StreamingOptions.md) = `{}`

Decoding options including language.

#### Returns

`AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); \}\>

An async generator yielding transcription updates.

#### Yields

An object containing `committed` and `nonCommitted` transcription results.

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:270](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L270)

Inserts a new audio chunk into the streaming transcription session.

#### Parameters

##### waveform

`Float32Array`

The audio chunk to insert.

#### Returns

`void`

---

### streamStop()

> **streamStop**(): `void`

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:277](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L277)

Stops the current streaming transcription session.

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options?`): `Promise`\<[`TranscriptionResult`](../interfaces/TranscriptionResult.md)\>

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:168](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L168)

Starts a transcription process for a given input array (16kHz waveform).
For multilingual models, specify the language in `options`.
Returns the transcription as a string. Passing `number[]` is deprecated.

#### Parameters

##### waveform

`Float32Array`

The Float32Array audio data.

##### options?

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

Decoding options including language.

#### Returns

`Promise`\<[`TranscriptionResult`](../interfaces/TranscriptionResult.md)\>

The transcription string.

---

### fromCustomModel()

> `static` **fromCustomModel**(`modelSource`, `tokenizerSource`, `isMultilingual`, `vad?`, `onDownloadProgress?`): `Promise`\<`SpeechToTextModule`\>

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:75](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L75)

Creates a Speech to Text instance with user-provided model binaries.
Use this when working with a custom-exported STT model.
Internally uses `'custom'` as the model name for telemetry.

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the tokenizer file.

##### isMultilingual

`boolean`

Whether the model supports multiple languages.

##### vad?

[`VADConfig`](../interfaces/VADConfig.md)

Optional VAD configuration.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`SpeechToTextModule`\>

A Promise resolving to a `SpeechToTextModule` instance.

#### Remarks

The native model contract for this method is not formally defined and may change
between releases. Currently only the Whisper architecture is supported by the native runner.
Refer to the native source code for the current expected interface.

---

### fromModelName()

> `static` **fromModelName**(`namedSources`, `vad?`, `onDownloadProgress?`): `Promise`\<`SpeechToTextModule`\>

Defined in: [modules/natural_language_processing/SpeechToTextModule.ts:43](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L43)

Creates a Speech to Text instance for a built-in model.

#### Parameters

##### namedSources

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

Configuration object containing model name, sources, and multilingual flag.

##### vad?

[`VADConfig`](../interfaces/VADConfig.md)

Optional configuration for Voice Activity Detection (VAD).

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`SpeechToTextModule`\>

A Promise resolving to a `SpeechToTextModule` instance.

#### Example

```ts
import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
const stt = await SpeechToTextModule.fromModelName(WHISPER_TINY_EN);
```
