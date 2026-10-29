# Interface: TextToSpeechInput

Defined in: [types/tts.ts:88](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L88)

Text to Speech module input definition

## Extended by

- [`TextToSpeechStreamingInput`](TextToSpeechStreamingInput.md)

## Properties

### phonemize?

> `optional` **phonemize**: `boolean`

Defined in: [types/tts.ts:91](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L91)

if true (default), the input is treated as text and converted to phonemes.
If false, the input should already be in IPA phonemes.

---

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:90](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L90)

optional speed argument - the higher it is, the faster the speech becomes

---

### text?

> `optional` **text**: `string`

Defined in: [types/tts.ts:89](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L89)

a text to be spoken
