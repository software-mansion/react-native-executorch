# Type Alias: SupertonicTtsChunk

> **SupertonicTtsChunk** = `object`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:119](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L119)

Audio output chunk yielded by the [createSupertonicTextToSpeech](../functions/createSupertonicTextToSpeech.md) generator.

## Properties

### audio

> `readonly` **audio**: `Float32Array`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:121](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L121)

Float32 PCM audio samples for this chunk, normalized in `[-1, 1]`.

---

### chunkIndex

> `readonly` **chunkIndex**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:127](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L127)

Zero-based index of this chunk.

---

### duration

> `readonly` **duration**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:125](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L125)

Estimated duration of this audio chunk in seconds.

---

### sampleRate

> `readonly` **sampleRate**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:123](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L123)

Audio sampling rate in Hz (see [SUPERTONIC_SAMPLE_RATE](../variables/SUPERTONIC_SAMPLE_RATE.md)).

---

### totalChunks

> `readonly` **totalChunks**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:129](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L129)

Total number of text chunks partitioned from the input text.
