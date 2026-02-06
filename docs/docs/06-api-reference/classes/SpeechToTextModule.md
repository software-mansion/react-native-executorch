# Class: SpeechToTextModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:15](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L15)

Module for Speech to Text (STT) functionalities.

## Constructors

### Constructor

> **new SpeechToTextModule**(): `SpeechToTextModule`

#### Returns

`SpeechToTextModule`

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:85](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L85)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:63](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L63)

Unloads the model from memory.

#### Returns

`void`

---

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:74](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L74)

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

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:26](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L26)

Loads the model specified by the config object.
`onDownloadProgressCallback` allows you to monitor the current progress of the model download.

#### Parameters

##### model

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

Configuration object containing model sources.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

---

### stream()

> **stream**(`options`): `AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); \}\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:127](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L127)

Starts a streaming transcription session.
Yields objects with `committed` and `nonCommitted` transcriptions.
Committed transcription contains the part of the transcription that is finalized and will not change.
Useful for displaying stable results during streaming.
Non-committed transcription contains the part of the transcription that is still being processed and may change.
Useful for displaying live, partial results during streaming.
Use with `streamInsert` and `streamStop` to control the stream.

#### Parameters

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

Decoding options including language.

#### Returns

`AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](../interfaces/TranscriptionResult.md); \}\>

An async generator yielding transcription updates.

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:200](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L200)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:207](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L207)

Stops the current streaming transcription session.

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options`): `Promise`\<[`TranscriptionResult`](../interfaces/TranscriptionResult.md)\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:103](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L103)

Starts a transcription process for a given input array (16kHz waveform).
For multilingual models, specify the language in `options`.
Returns the transcription as a string. Passing `number[]` is deprecated.

#### Parameters

##### waveform

`Float32Array`

The Float32Array audio data.

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

Decoding options including language.

#### Returns

`Promise`\<[`TranscriptionResult`](../interfaces/TranscriptionResult.md)\>

The transcription string.
