# Class: SpeechToTextModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:7](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L7)

## Constructors

### Constructor

> **new SpeechToTextModule**(): `SpeechToTextModule`

#### Returns

`SpeechToTextModule`

## Methods

### decode()

> **decode**(`tokens`, `encoderOutput`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:74](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L74)

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

***

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:51](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L51)

#### Returns

`void`

***

### encode()

> **encode**(`waveform`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:55](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L55)

#### Parameters

##### waveform

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L17)

#### Parameters

##### model

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

***

### stream()

> **stream**(`options`): `AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:121](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L121)

#### Parameters

##### options

[`DecodingOptions`](../interfaces/DecodingOptions.md) = `{}`

#### Returns

`AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

***

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:176](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L176)

#### Parameters

##### waveform

`number`[] | `Float32Array`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### streamStop()

> **streamStop**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:186](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L186)

#### Returns

`void`

***

### transcribe()

> **transcribe**(`waveform`, `options`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/SpeechToTextModule.ts:102](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/SpeechToTextModule.ts#L102)

Transcribes audio using the Whisper model.

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
