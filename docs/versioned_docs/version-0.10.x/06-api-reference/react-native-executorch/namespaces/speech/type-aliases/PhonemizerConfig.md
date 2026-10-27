# Type Alias: PhonemizerConfig

> **PhonemizerConfig** = `object`

Defined in: [extensions/speech/utils/phonemizer.ts:20](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L20)

Configuration options and asset paths for initializing a [Phonemizer](Phonemizer.md).

## Properties

### lang

> `readonly` **lang**: [`PhonemizerLanguage`](PhonemizerLanguage.md)

Defined in: [extensions/speech/utils/phonemizer.ts:22](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L22)

Target language code to configure the G2P rules for.

---

### lexiconSource?

> `readonly` `optional` **lexiconSource**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:26](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L26)

Optional local file path to the pronunciation lexicon dictionary.

---

### neuralModelSource?

> `readonly` `optional` **neuralModelSource**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:28](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L28)

Optional local file path to the neural G2P model data.

---

### taggerSource?

> `readonly` `optional` **taggerSource**: `string`

Defined in: [extensions/speech/utils/phonemizer.ts:24](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L24)

Optional local file path to the part-of-speech tagger model data.
