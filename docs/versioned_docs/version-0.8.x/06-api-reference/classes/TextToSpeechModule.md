# Class: TextToSpeechModule

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L17)

Module for Text to Speech (TTS) functionalities.

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:275](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L275)

Unloads the model from memory.

#### Returns

`void`

***

### forward()

> **forward**(`text`, `speed?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:117](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L117)

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

***

### forwardFromPhonemes()

> **forwardFromPhonemes**(`phonemes`, `speed?`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:133](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L133)

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

***

### stream()

> **stream**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:147](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L147)

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

***

### streamFromPhonemes()

> **streamFromPhonemes**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:204](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L204)

Starts a streaming synthesis session from pre-computed phonemes.
Bypasses the built-in phonemizer, allowing use of external G2P systems.

#### Parameters

##### input

[`TextToSpeechStreamingPhonemeInput`](../interfaces/TextToSpeechStreamingPhonemeInput.md)

Input object containing phonemes and optional speed.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>\>

An async generator yielding Float32Array audio chunks.

#### Yields

An audio chunk generated during synthesis.

***

### streamInsert()

> **streamInsert**(`textChunk`): `void`

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:255](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L255)

Inserts new text chunk into the buffer to be processed in streaming mode.

#### Parameters

##### textChunk

`string`

The text fragment to append to the streaming buffer.

#### Returns

`void`

***

### streamStop()

> **streamStop**(`instant?`): `void`

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:264](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L264)

Stops the streaming process if there is any ongoing.

#### Parameters

##### instant?

`boolean` = `true`

If true, stops the streaming as soon as possible. Otherwise
                 allows the module to complete processing for the remains of the buffer.

#### Returns

`void`

***

### fromModelName()

> `static` **fromModelName**(`config`, `onDownloadProgress?`): `Promise`\<`TextToSpeechModule`\>

Defined in: [modules/natural\_language\_processing/TextToSpeechModule.ts:39](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L39)

Creates a Text to Speech instance.

#### Parameters

##### config

[`TextToSpeechConfig`](../interfaces/TextToSpeechConfig.md)

Configuration object containing `model` and `voice`.
  Pass one of the built-in constants (e.g. `{ model: KOKORO_MEDIUM, voice: KOKORO_VOICE_AF_HEART }`), or use require() to pass them.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`TextToSpeechModule`\>

A Promise resolving to a `TextToSpeechModule` instance.

#### Example

```ts
import { TextToSpeechModule, KOKORO_MEDIUM, KOKORO_VOICE_AF_HEART } from 'react-native-executorch';
const tts = await TextToSpeechModule.fromModelName(
  { model: KOKORO_MEDIUM, voice: KOKORO_VOICE_AF_HEART },
);
```
