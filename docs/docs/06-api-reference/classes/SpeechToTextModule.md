# Class: SpeechToTextModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L12)

Module for Speech to Text (STT) functionalities.

## Constructors

### Constructor

> **new SpeechToTextModule**(): `SpeechToTextModule`

#### Returns

`SpeechToTextModule`

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:96](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L96)

Runs the decoder of the model. Passing number[] is deprecated.

#### Parameters

##### tokens

The input tokens.

`number`[] | `Int32Array`\<`ArrayBufferLike`\>

##### encoderOutput

The encoder output.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Decoded output.

---

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:66](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L66)

Unloads the model from memory.

#### Returns

`void`

---

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:77](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L77)

Runs the encoding part of the model on the provided waveform.
Returns the encoded waveform as a Float32Array. Passing `number[]` is deprecated.

#### Parameters

##### waveform

The input audio waveform.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

The encoded output.

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:29](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L29)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:153](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L153)

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

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:213](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L213)

Inserts a new audio chunk into the streaming transcription session. Passing `number[]` is deprecated.

#### Parameters

##### waveform

The audio chunk to insert.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`void`

---

### streamStop()

> **streamStop**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:226](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L226)

Stops the current streaming transcription session.

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:126](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L126)

Starts a transcription process for a given input array (16kHz waveform).
For multilingual models, specify the language in `options`.
Returns the transcription as a string. Passing `number[]` is deprecated.

#### Parameters

##### waveform

The Float32Array audio data.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

Decoding options including language.

#### Returns

`Promise`\<`string`\>

The transcription string.
