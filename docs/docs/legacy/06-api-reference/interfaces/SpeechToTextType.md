# Interface: SpeechToTextType

Defined in: [types/stt.ts:40](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L40)

React hook for managing Speech to Text (STT) instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/stt.ts:59](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L59)

Tracks the progress of the model download process.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/stt.ts:44](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L44)

Contains the error message if the model failed to load.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/stt.ts:54](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L54)

Indicates whether the model is currently processing an inference.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/stt.ts:49](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L49)

Indicates whether the model has successfully loaded and is ready for inference.

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/stt.ts:74](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L74)

Runs the decoder of the model.

#### Parameters

##### tokens

`Int32Array`

The encoded audio data.

##### encoderOutput

`Float32Array`

The output from the encoder.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the decoded text.

---

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/stt.ts:66](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L66)

Runs the encoding part of the model on the provided waveform.

#### Parameters

##### waveform

`Float32Array`

The input audio waveform array.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the encoded data.

---

### stream()

> **stream**(`options?`): `AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](TranscriptionResult.md); \}, `void`, `unknown`\>

Defined in: [types/stt.ts:99](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L99)

Starts a streaming transcription process.
Use in combination with `streamInsert` to feed audio chunks and `streamStop` to end the stream.
Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.

#### Parameters

##### options?

[`StreamingOptions`](StreamingOptions.md)

Decoding options including language.

#### Returns

`AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](TranscriptionResult.md); \}, `void`, `unknown`\>

Asynchronous generator that returns `committed` and `nonCommitted` transcription.
Both `committed` and `nonCommitted` are of type `TranscriptionResult`

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [types/stt.ts:112](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L112)

Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription.

#### Parameters

##### waveform

`Float32Array`

The audio chunk to insert.

#### Returns

`void`

---

### streamStop()

> **streamStop**(): `void`

Defined in: [types/stt.ts:117](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L117)

Stops the ongoing streaming transcription process.

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options?`): `Promise`\<[`TranscriptionResult`](TranscriptionResult.md)\>

Defined in: [types/stt.ts:86](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L86)

Starts a transcription process for a given input array, which should be a waveform at 16kHz.

#### Parameters

##### waveform

`Float32Array`

The input audio waveform.

##### options?

[`DecodingOptions`](DecodingOptions.md)

Decoding options, check API reference for more details.

#### Returns

`Promise`\<[`TranscriptionResult`](TranscriptionResult.md)\>

Resolves a promise with the output transcription. Result of transcription is
object of type `TranscriptionResult`.
