# Type Alias: KokoroTtsChunk

> **KokoroTtsChunk** = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:127](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L127)

Audio output chunk yielded by the [createKokoroTextToSpeech](../functions/createKokoroTextToSpeech.md) generator.

## Properties

### audio

> `readonly` **audio**: `Float32Array`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:129](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L129)

Float32 PCM audio samples for this chunk, normalized in `[-1, 1]`.

---

### chunkIndex

> `readonly` **chunkIndex**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:135](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L135)

Zero-based index of this chunk.

---

### duration

> `readonly` **duration**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:133](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L133)

Duration of this audio chunk in seconds.

---

### sampleRate

> `readonly` **sampleRate**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:131](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L131)

Audio sampling rate in Hz (see [KOKORO_SAMPLE_RATE](../variables/KOKORO_SAMPLE_RATE.md)).

---

### totalChunks

> `readonly` **totalChunks**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:137](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L137)

Total number of chunks partitioned from the input text.

---

### words

> `readonly` **words**: readonly [`KokoroTtsWord`](KokoroTtsWord.md)[]

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:143](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L143)

Words of the input text whose speech ends in this chunk, in order. Words
with nothing to pronounce (e.g. standalone punctuation) are left out, and
the list is empty if the text could not be aligned with its phonemes.
