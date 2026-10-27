# Type Alias: PhonemizedWord

> **PhonemizedWord** = `object`

Defined in: [extensions/speech/utils/phonemizer.ts:45](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L45)

A word of the input text, located in its phonemization.

## Properties

### offset

> `readonly` **offset**: `number`

Defined in: [extensions/speech/utils/phonemizer.ts:49](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L49)

UTF-16 offset of the word in the input text.

---

### phonemeLength

> `readonly` **phonemeLength**: `number`

Defined in: [extensions/speech/utils/phonemizer.ts:53](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L53)

UTF-16 length of the word's phonemes.

---

### phonemeOffset

> `readonly` **phonemeOffset**: `number`

Defined in: [extensions/speech/utils/phonemizer.ts:51](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L51)

UTF-16 offset of the word's phonemes in [PhonemizedText.phonemes](PhonemizedText.md#phonemes).

---

### text

> `readonly` **text**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:47](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L47)

The word as it appears in the input text.
