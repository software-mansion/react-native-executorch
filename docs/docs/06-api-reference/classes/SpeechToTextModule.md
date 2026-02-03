# Class: SpeechToTextModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L11)

Module for Speech to Text (STT) functionalities.

## Constructors

### Constructor

> **new SpeechToTextModule**(): `SpeechToTextModule`

#### Returns

`SpeechToTextModule`

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:87](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L87)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:65](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L65)

Unloads the model from memory.

#### Returns

`void`

---

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:76](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L76)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:28](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L28)

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

> **stream**(`options`): `AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:125](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L125)

Starts a streaming transcription session.
Yields objects with `committed` and `nonCommitted` transcriptions.
Use with `streamInsert` and `streamStop` to control the stream.

#### Parameters

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

Decoding options including language.

#### Returns

`AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

An async generator yielding transcription updates.

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:185](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L185)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:192](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L192)

Stops the current streaming transcription session.

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:105](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L105)

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

`Promise`\<`string`\>

The transcription string.
