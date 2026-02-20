# Class: TextToSpeechModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L17)

Module for Text to Speech (TTS) functionalities.

## Constructors

### Constructor

> **new TextToSpeechModule**(): `TextToSpeechModule`

#### Returns

`TextToSpeechModule`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L21)

Native module instance

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:182](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L182)

Unloads the model from memory.

#### Returns

`void`

---

### forward()

> **forward**(`text`, `speed`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:109](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L109)

Synthesizes the provided text into speech.
Returns a promise that resolves to the full audio waveform as a `Float32Array`.

#### Parameters

##### text

`string`

The input text to be synthesized.

##### speed

`number` = `1.0`

Optional speed multiplier for the speech synthesis (default is 1.0).

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the synthesized audio waveform.

---

### load()

> **load**(`config`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:30](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L30)

Loads the model and voice assets specified by the config object.
`onDownloadProgressCallback` allows you to monitor the current progress.

#### Parameters

##### config

[`TextToSpeechConfig`](../interfaces/TextToSpeechConfig.md)

Configuration object containing `model` source and `voice`.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

---

### stream()

> **stream**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:127](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L127)

Starts a streaming synthesis session. Yields audio chunks as they are generated.

#### Parameters

##### input

[`TextToSpeechStreamingInput`](../interfaces/TextToSpeechStreamingInput.md)

Input object containing text and optional speed.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

An async generator yielding Float32Array audio chunks.

---

### streamStop()

> **streamStop**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts:175](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L175)

Stops the streaming process if there is any ongoing.

#### Returns

`void`
