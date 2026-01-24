# Interface: SpeechToTextType

Defined in: [packages/react-native-executorch/src/types/stt.ts:7](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L7)

React hook for managing Speech to Text (STT) instance.

## Properties

### committedTranscription

> **committedTranscription**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:32](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L32)

Contains the part of the transcription that is finalized and will not change. 
Useful for displaying stable results during streaming.

***

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:26](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L26)

Tracks the progress of the model download process.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/stt.ts:11](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L11)

Contains the error message if the model failed to load.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:21](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L21)

Indicates whether the model is currently processing an inference.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:16](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L16)

Indicates whether the model has successfully loaded and is ready for inference.

***

### nonCommittedTranscription

> **nonCommittedTranscription**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:38](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L38)

Contains the part of the transcription that is still being processed and may change.
Useful for displaying live, partial results during streaming.

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:53](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L53)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:45](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L45)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:71](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L71)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:78](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L78)

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

Defined in: [packages/react-native-executorch/src/types/stt.ts:83](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L83)

Stops the ongoing streaming transcription process.

#### Returns

`void`

***

### transcribe()

> **transcribe**(`waveform`, `options?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/stt.ts:62](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/stt.ts#L62)

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
