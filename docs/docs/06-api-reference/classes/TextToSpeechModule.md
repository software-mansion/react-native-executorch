# Class: TextToSpeechModule

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:18](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L18)

Module for Text to Speech (TTS) functionalities.

## Constructors

### Constructor

> **new TextToSpeechModule**(): `TextToSpeechModule`

#### Returns

`TextToSpeechModule`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L22)

Native module instance

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:229](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L229)

Unloads the model from memory.

#### Returns

`void`

---

### forward()

> **forward**(`text`, `speed?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:118](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L118)

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

### forwardFromPhonemes()

> **forwardFromPhonemes**(`phonemes`, `speed?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:135](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L135)

Synthesizes pre-computed phonemes into speech, bypassing the built-in phonemizer.
This allows using an external G2P system (e.g. the Python `phonemizer` library,
espeak-ng, or any custom phonemizer).

#### Parameters

##### phonemes

`string`

The pre-computed IPA phoneme string.

##### speed?

`number` = `1.0`

Optional speed multiplier for the speech synthesis (default is 1.0).

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the synthesized audio waveform.

---

### load()

> **load**(`config`, `onDownloadProgressCallback?`): `Promise`\<`void`\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:31](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L31)

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

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:196](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L196)

Starts a streaming synthesis session. Yields audio chunks as they are generated.

#### Parameters

##### input

[`TextToSpeechStreamingInput`](../interfaces/TextToSpeechStreamingInput.md)

Input object containing text and optional speed.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

An async generator yielding Float32Array audio chunks.

---

### streamFromPhonemes()

> **streamFromPhonemes**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:210](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L210)

Starts a streaming synthesis session from pre-computed phonemes.
Bypasses the built-in phonemizer, allowing use of external G2P systems.

#### Parameters

##### input

[`TextToSpeechStreamingPhonemeInput`](../interfaces/TextToSpeechStreamingPhonemeInput.md)

Input object containing phonemes and optional speed.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

An async generator yielding Float32Array audio chunks.

---

### streamStop()

> **streamStop**(): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:222](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L222)

Stops the streaming process if there is any ongoing.

#### Returns

`void`
