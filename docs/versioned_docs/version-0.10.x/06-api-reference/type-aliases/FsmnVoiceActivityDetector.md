# Type Alias: FsmnVoiceActivityDetector

> **FsmnVoiceActivityDetector** = `object`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:180](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L180)

Voice activity detection task runner using the FSMN-VAD model.

## Properties

### detectVoice()

> `readonly` **detectVoice**: (`waveform`, `options?`) => `Promise`\<[`VadSegment`](VadSegment.md)[]\>

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:196](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L196)

Asynchronously detects speech segments within a mono waveform sampled at
[FSMN_VAD_SAMPLE_RATE_HZ](../variables/FSMN_VAD_SAMPLE_RATE_HZ.md).

#### Parameters

##### waveform

`Float32Array`

The input audio samples (16 kHz mono Float32 PCM).

##### options?

[`VadOptions`](VadOptions.md)

Optional per-call overrides of the detection thresholds.
See [VadOptions](VadOptions.md).

#### Returns

`Promise`\<[`VadSegment`](VadSegment.md)[]\>

A promise resolving to the detected speech segments, in seconds.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### detectVoiceOnStream()

> `readonly` **detectVoiceOnStream**: (`chunk`, `options?`) => [`VadEvent`](VadEvent.md) \| `undefined`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:217](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L217)

Appends a live audio chunk to a bounded rolling window, runs detection over
that window and reports a [VadEvent](VadEvent.md) when speech starts or stops,
otherwise `undefined`. Designed to be driven straight from a recorder
callback. Detection runs synchronously on the calling thread (a few ms).

#### Parameters

##### chunk

`Float32Array`

The newly captured audio samples (16 kHz mono Float32 PCM).

##### options?

[`VadStreamOptions`](VadStreamOptions.md)

Optional overrides of the detection thresholds and margin.
See [VadStreamOptions](VadStreamOptions.md).

#### Returns

[`VadEvent`](VadEvent.md) \| `undefined`

`'speechStart'` or `'speechEnd'` if state transitioned, otherwise
`undefined`.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### detectVoiceWorklet()

> `readonly` **detectVoiceWorklet**: (`waveform`, `options?`) => [`VadSegment`](VadSegment.md)[]

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:202](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L202)

Synchronous version of [detectVoice](#detectvoice) to be executed directly on the caller
or worklet thread.

#### Parameters

##### waveform

`Float32Array`

##### options?

[`VadOptions`](VadOptions.md)

#### Returns

[`VadSegment`](VadSegment.md)[]

---

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:184](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L184)

Releases all allocated native resources.

#### Returns

`void`

---

### resetStream()

> `readonly` **resetStream**: () => `void`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:225](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L225)

Clears the rolling window and speaking state used by [detectVoiceOnStream](#detectvoiceonstream).

#### Returns

`void`
