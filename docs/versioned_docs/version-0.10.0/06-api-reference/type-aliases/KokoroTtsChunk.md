# Type Alias: KokoroTtsChunk

> **KokoroTtsChunk** = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:105](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L105)

Audio output chunk yielded by the [createKokoroTextToSpeech](../functions/createKokoroTextToSpeech.md) generator.

## Properties

### audio

> `readonly` **audio**: `Float32Array`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:107](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L107)

Float32 PCM audio samples for this chunk, normalized in `[-1, 1]`.

---

### chunkIndex

> `readonly` **chunkIndex**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:113](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L113)

Zero-based index of this chunk.

---

### duration

> `readonly` **duration**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:111](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L111)

Duration of this audio chunk in seconds.

---

### sampleRate

> `readonly` **sampleRate**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:109](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L109)

Audio sampling rate in Hz (see [KOKORO_SAMPLE_RATE](../variables/KOKORO_SAMPLE_RATE.md)).

---

### totalChunks

> `readonly` **totalChunks**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:115](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L115)

Total number of chunks partitioned from the input text.
