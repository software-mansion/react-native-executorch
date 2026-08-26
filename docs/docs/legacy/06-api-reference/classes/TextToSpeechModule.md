# Class: TextToSpeechModule

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L16)

Module for Text to Speech (TTS) functionalities.

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:210](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L210)

Unloads the model from memory.

#### Returns

`void`

---

### forward()

> **forward**(`input`, `speed?`, `phonemize?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:119](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L119)

Synthesizes the provided input (text or IPA phonemes) into speech.

#### Parameters

##### input

`string`

The input text or phonemes to be synthesized.

##### speed?

`number` = `1.0`

Playback speed multiplier (default: 1.0).

##### phonemize?

`boolean` = `true`

If true (default), treats input as text and converts it to phonemes.
If false, input is treated as phonemes.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to the full audio waveform as a `Float32Array`.

---

### stream()

> **stream**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:134](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L134)

Starts a streaming synthesis session. Yields audio chunks as they are generated.

#### Parameters

##### input

[`TextToSpeechStreamingInput`](../interfaces/TextToSpeechStreamingInput.md)

Input object containing optional speed, phonemize flag and stopAutomatically flag.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

An async generator yielding Float32Array audio chunks.

#### Yields

An audio chunk generated during synthesis.

---

### streamInsert()

> **streamInsert**(`input`): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:190](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L190)

Inserts new content (text or IPA phonemes) into the buffer to be processed in streaming mode.

#### Parameters

##### input

`string`

The text or phoneme fragment to append to the streaming buffer.

#### Returns

`void`

---

### streamStop()

> **streamStop**(`instant?`): `void`

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:199](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L199)

Stops the streaming process if there is any ongoing.

#### Parameters

##### instant?

`boolean` = `true`

If true, stops the streaming as soon as possible. Otherwise
allows the module to complete processing for the remains of the buffer.

#### Returns

`void`

---

### fromModelName()

> `static` **fromModelName**(`config`, `onDownloadProgress?`): `Promise`\<`TextToSpeechModule`\>

Defined in: [modules/natural_language_processing/TextToSpeechModule.ts:30](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L30)

Creates a Text to Speech instance.

#### Parameters

##### config

[`TextToSpeechModelConfig`](../interfaces/TextToSpeechModelConfig.md)

Configuration object containing model and voice sources.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`TextToSpeechModule`\>

A Promise resolving to a `TextToSpeechModule` instance.
