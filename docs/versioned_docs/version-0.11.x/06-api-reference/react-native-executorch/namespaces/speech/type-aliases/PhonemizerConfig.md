# Type Alias: PhonemizerConfig

> **PhonemizerConfig** = `object`

Defined in: [extensions/speech/utils/phonemizer.ts:30](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L30)

Configuration options and asset paths for initializing a [Phonemizer](Phonemizer.md).

## Properties

### lang

> `readonly` **lang**: [`PhonemizerLanguage`](PhonemizerLanguage.md)

Defined in: [extensions/speech/utils/phonemizer.ts:32](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L32)

Target language code to configure the G2P rules for.

---

### lexiconSource?

> `readonly` `optional` **lexiconSource**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:36](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L36)

Optional local file path to the pronunciation lexicon dictionary.

---

### neuralModelSource?

> `readonly` `optional` **neuralModelSource**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:38](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L38)

Optional local file path to the neural G2P model data.

---

### taggerSource?

> `readonly` `optional` **taggerSource**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:34](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L34)

Optional local file path to the part-of-speech tagger model data.
