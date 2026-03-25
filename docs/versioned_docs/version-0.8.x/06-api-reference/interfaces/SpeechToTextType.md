# Interface: SpeechToTextType

Defined in: [types/stt.ts:38](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L38)

React hook for managing Speech to Text (STT) instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/stt.ts:57](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L57)

Tracks the progress of the model download process.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/stt.ts:42](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L42)

Contains the error message if the model failed to load.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/stt.ts:52](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L52)

Indicates whether the model is currently processing an inference.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/stt.ts:47](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L47)

Indicates whether the model has successfully loaded and is ready for inference.

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/stt.ts:72](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L72)

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

***

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/stt.ts:64](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L64)

Runs the encoding part of the model on the provided waveform.

#### Parameters

##### waveform

`Float32Array`

The input audio waveform array.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the encoded data.

***

### stream()

> **stream**(`options?`): `AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](TranscriptionResult.md); \}, `void`, `unknown`\>

Defined in: [types/stt.ts:97](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L97)

Starts a streaming transcription process.
Use in combination with `streamInsert` to feed audio chunks and `streamStop` to end the stream.
Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.

#### Parameters

##### options?

[`DecodingOptions`](DecodingOptions.md)

Decoding options including language.

#### Returns

`AsyncGenerator`\<\{ `committed`: [`TranscriptionResult`](TranscriptionResult.md); `nonCommitted`: [`TranscriptionResult`](TranscriptionResult.md); \}, `void`, `unknown`\>

Asynchronous generator that returns `committed` and `nonCommitted` transcription.
Both `committed` and `nonCommitted` are of type `TranscriptionResult`

***

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [types/stt.ts:110](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L110)

Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription.

#### Parameters

##### waveform

`Float32Array`

The audio chunk to insert.

#### Returns

`void`

***

### streamStop()

> **streamStop**(): `void`

Defined in: [types/stt.ts:115](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L115)

Stops the ongoing streaming transcription process.

#### Returns

`void`

***

### transcribe()

> **transcribe**(`waveform`, `options?`): `Promise`\<[`TranscriptionResult`](TranscriptionResult.md)\>

Defined in: [types/stt.ts:84](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L84)

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
