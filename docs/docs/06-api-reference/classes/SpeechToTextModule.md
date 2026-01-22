# Class: SpeechToTextModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:7](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L7)

## Constructors

### Constructor

> **new SpeechToTextModule**(): `SpeechToTextModule`

#### Returns

`SpeechToTextModule`

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:67](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L67)

#### Parameters

##### tokens

`number`[] | `Int32Array`\<`ArrayBufferLike`\>

##### encoderOutput

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

---

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:51](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L51)

#### Returns

`void`

---

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:55](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L55)

#### Parameters

##### waveform

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L17)

#### Parameters

##### model

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

---

### stream()

> **stream**(`options`): `AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:113](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L113)

#### Parameters

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

#### Returns

`AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:168](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L168)

#### Parameters

##### waveform

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`void`

---

### streamStop()

> **streamStop**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:178](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L178)

#### Returns

`void`

---

### transcribe()

> **transcribe**(`waveform`, `options`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts:94](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L94)

Transcribes audio using the Whisper model.

#### Parameters

##### waveform

The Float32Array audio data.

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

#### Returns

`Promise`\<`string`\>

The transcription string.
