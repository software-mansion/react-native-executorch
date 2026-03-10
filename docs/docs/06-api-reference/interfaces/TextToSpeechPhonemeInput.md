# Interface: TextToSpeechPhonemeInput

Defined in: [types/tts.ts:103](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L103)

Text to Speech module input for pre-computed phonemes.
Use this when you have your own phonemizer (e.g. the Python `phonemizer`
library, espeak-ng, or any custom G2P system) and want to bypass the
built-in phonemizer pipeline.

## Extended by

- [`TextToSpeechStreamingPhonemeInput`](TextToSpeechStreamingPhonemeInput.md)

## Properties

### phonemes

> **phonemes**: `string`

Defined in: [types/tts.ts:104](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L104)

pre-computed IPA phoneme string

---

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:105](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L105)

optional speed argument - the higher it is, the faster the speech becomes
