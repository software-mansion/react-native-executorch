# Interface: SpeechToTextType

Defined in: [packages/react-native-executorch/src/types/stt.ts:25](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L25)

React hook for managing Speech to Text (STT) instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L44)

Tracks the progress of the model download process.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/stt.ts:29](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L29)

Contains the error message if the model failed to load.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:39](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L39)

Indicates whether the model is currently processing an inference.

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:34](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L34)

Indicates whether the model has successfully loaded and is ready for inference.

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:59](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L59)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:51](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L51)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L84)

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

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [packages/react-native-executorch/src/types/stt.ts:97](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L97)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:102](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L102)

Stops the ongoing streaming transcription process.

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options?`): `Promise`\<[`TranscriptionResult`](TranscriptionResult.md)\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:71](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L71)

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
