# Type Alias: WhisperSpeechToText\<L\>

> **WhisperSpeechToText**\<`L`\> = `object`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L108)

Whisper speech-to-text task runner.

## Type Parameters

### L

`L` _extends_ [`WhisperLanguage`](WhisperLanguage.md) = [`WhisperLanguage`](WhisperLanguage.md)

The language type accepted by the model.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:112](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L112)

Releases all allocated native resources.

#### Returns

`void`

---

### stream()

> `readonly` **stream**: (`options`) => `AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:160](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L160)

Async generator for real-time microphone transcription. Feed audio with
[streamInsert](#streaminsert) and stop with [streamStop](#streamstop). Yields `{ committed,
nonCommitted }` on every VAD or transcription event: `committed` is the
finalized transcript so far; `nonCommitted` is the in-progress text that
may still change.

#### Parameters

##### options

[`WhisperStreamOptions`](WhisperStreamOptions.md)\<`L`\>

Stream options (language and optional VAD tuning).
See [WhisperStreamOptions](WhisperStreamOptions.md).

#### Returns

`AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\>

An AsyncGenerator yielding transcript updates.

#### Throws

With code `INVALID_ARGUMENT` if the language is
unsupported, `RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED`
if disposed.

---

### streamInsert()

> `readonly` **streamInsert**: (`audioChunk`) => `void`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:176](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L176)

Appends a new PCM chunk to the live streaming buffer consumed by
[stream](#stream). Ignored when streaming is not active.

#### Parameters

##### audioChunk

`Float32Array`

The newly captured audio samples (16 kHz mono Float32
PCM).

#### Returns

`void`

---

### streamStop()

> `readonly` **streamStop**: () => `void`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:168](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L168)

Signals the [stream](#stream) generator to finalize the current segment and
return. Safe to call even when streaming is not active.

#### Returns

`void`

---

### transcribe()

> `readonly` **transcribe**: (`audio`, `options`, `onToken?`) => `Promise`\<`string`\>

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:126](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L126)

Asynchronously transcribes a pre-recorded mono waveform sampled at
[WHISPER_SAMPLE_RATE_HZ](../variables/WHISPER_SAMPLE_RATE_HZ.md).

#### Parameters

##### audio

`Float32Array`

Raw 16 kHz mono PCM audio samples (Float32Array).

##### options

[`WhisperSttOptions`](WhisperSttOptions.md)\<`L`\>

Transcription options. See [WhisperSttOptions](WhisperSttOptions.md).

##### onToken?

(`token`) => `void`

Optional callback fired on the RN thread for each decoded
token.

#### Returns

`Promise`\<`string`\>

A promise resolving to the full transcript string.

#### Throws

With code `INVALID_ARGUMENT` if the language is
unsupported, `RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED`
if disposed.

---

### transcribeStop()

> `readonly` **transcribeStop**: () => `void`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:145](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L145)

Interrupts and stops any active transcription call.

#### Returns

`void`

---

### transcribeWorklet()

> `readonly` **transcribeWorklet**: (`audio`, `options`, `onToken?`) => `string`

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:136](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L136)

Synchronous version of [transcribe](#transcribe) to be executed directly on the
caller or worklet thread.

#### Parameters

##### audio

`Float32Array`

##### options

[`WhisperSttOptions`](WhisperSttOptions.md)\<`L`\>

##### onToken?

(`token`) => `void`

#### Returns

`string`
