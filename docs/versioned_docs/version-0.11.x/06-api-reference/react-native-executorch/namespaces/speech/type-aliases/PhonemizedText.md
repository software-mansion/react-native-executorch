# Type Alias: PhonemizedText

> **PhonemizedText** = `object`

Defined in: [extensions/speech/utils/phonemizer.ts:60](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L60)

Phonemization of a text, together with the position of each of its words.

## Properties

### phonemes

> `readonly` **phonemes**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:62](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L62)

IPA transcription of the whole text, the same as `phonemize(text)` returns.

---

### words

> `readonly` **words**: readonly [`PhonemizedWord`](PhonemizedWord.md)[]

Defined in: [extensions/speech/utils/phonemizer.ts:69](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L69)

The whitespace-separated words of the input text (segmented words for
Chinese), in order. Each maps onto one space-separated phoneme group,
except numbers, which map onto as many as they were spelled out into.
Empty if the words could not be matched.
