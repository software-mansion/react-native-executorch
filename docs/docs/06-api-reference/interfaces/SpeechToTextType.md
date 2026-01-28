# Interface: SpeechToTextType

Defined in: [packages/react-native-executorch/src/types/stt.ts:9](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L9)

React hook for managing Speech to Text (STT) instance.

## Properties

### committedTranscription

> **committedTranscription**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:34](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L34)

Contains the part of the transcription that is finalized and will not change. 
Useful for displaying stable results during streaming.

***

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:28](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L28)

Tracks the progress of the model download process.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/stt.ts:13](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L13)

Contains the error message if the model failed to load.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:23](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L23)

Indicates whether the model is currently processing an inference.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:18](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L18)

Indicates whether the model has successfully loaded and is ready for inference.

***

### nonCommittedTranscription

> **nonCommittedTranscription**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:40](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L40)

Contains the part of the transcription that is still being processed and may change.
Useful for displaying live, partial results during streaming.

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:55](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L55)

Runs the decoder of the model. Passing `number[]` is deprecated.

#### Parameters

##### tokens

The encoded audio data.

`number`[] | `Int32Array`\<`ArrayBufferLike`\>

##### encoderOutput

The output from the encoder.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the decoded text.

***

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:47](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L47)

Runs the encoding part of the model on the provided waveform. Passing `number[]` is deprecated.

#### Parameters

##### waveform

The input audio waveform array.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the encoded data.

***

### stream()

> **stream**(`options?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:73](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L73)

Starts a streaming transcription process.
Use in combination with streamInsert to feed audio chunks and streamStop to end the stream.
Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.

#### Parameters

##### options?

[`DecodingOptions`](DecodingOptions.md)

Decoding options including language.

#### Returns

`Promise`\<`string`\>

The final transcription string.

***

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [packages/react-native-executorch/src/types/stt.ts:80](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L80)

Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription.
Passing `number[]` is deprecated.

#### Parameters

##### waveform

The audio chunk to insert.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### streamStop()

> **streamStop**(): `void`

Defined in: [packages/react-native-executorch/src/types/stt.ts:85](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L85)

Stops the ongoing streaming transcription process.

#### Returns

`void`

***

### transcribe()

> **transcribe**(`waveform`, `options?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:64](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/stt.ts#L64)

Starts a transcription process for a given input array, which should be a waveform at 16kHz.
Passing `number[]` is deprecated.

#### Parameters

##### waveform

The input audio waveform.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

##### options?

[`DecodingOptions`](DecodingOptions.md)

Decoding options, e.g. `{ language: 'es' }` for multilingual models.

#### Returns

`Promise`\<`string`\>

Resolves a promise with the output transcription when the model is finished.
