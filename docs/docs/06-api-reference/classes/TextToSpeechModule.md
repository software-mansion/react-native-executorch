# Class: TextToSpeechModule

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L16)

Module for Text to Speech (TTS) functionalities.

## Constructors

### Constructor

> **new TextToSpeechModule**(): `TextToSpeechModule`

#### Returns

`TextToSpeechModule`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:20](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L20)

Native module instance

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:179](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L179)

Unloads the model from memory.

#### Returns

`void`

---

### forward()

> **forward**(`text`, `speed?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:106](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L106)

Synthesizes the provided text into speech.
Returns a promise that resolves to the full audio waveform as a `Float32Array`.

#### Parameters

##### text

`string`

The input text to be synthesized.

##### speed?

`number` = `1.0`

Optional speed multiplier for the speech synthesis (default is 1.0).

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the synthesized audio waveform.

---

### load()

> **load**(`config`, `onDownloadProgressCallback?`): `Promise`\<`void`\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:28](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L28)

Loads the model and voice assets specified by the config object.
`onDownloadProgressCallback` allows you to monitor the current progress.

#### Parameters

##### config

[`TextToSpeechConfig`](../interfaces/TextToSpeechConfig.md)

Configuration object containing `model` source and `voice`.

##### onDownloadProgressCallback?

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

---

### stream()

> **stream**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:124](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L124)

Starts a streaming synthesis session. Yields audio chunks as they are generated.

#### Parameters

##### input

[`TextToSpeechStreamingInput`](../interfaces/TextToSpeechStreamingInput.md)

Input object containing text and optional speed.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

An async generator yielding Float32Array audio chunks.

#### Yields

An audio chunk generated during synthesis.

---

### streamStop()

> **streamStop**(): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:172](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L172)

Stops the streaming process if there is any ongoing.

#### Returns

`void`
