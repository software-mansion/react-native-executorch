# Interface: TextToSpeechPhonemeInput

Defined in: [types/tts.ts:100](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L100)

Text to Speech module input for pre-computed phonemes.
Use this when you have your own phonemizer (e.g. the Python `phonemizer`
library, espeak-ng, or any custom G2P system) and want to bypass the
built-in phonemizer pipeline.

## Extended by

- [`TextToSpeechStreamingPhonemeInput`](TextToSpeechStreamingPhonemeInput.md)

## Properties

### phonemes

> **phonemes**: `string`

Defined in: [types/tts.ts:101](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L101)

pre-computed IPA phoneme string

***

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:102](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L102)

optional speed argument - the higher it is, the faster the speech becomes
