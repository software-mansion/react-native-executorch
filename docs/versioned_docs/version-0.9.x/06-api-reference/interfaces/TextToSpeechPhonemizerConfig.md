# Interface: TextToSpeechPhonemizerConfig

Defined in: [types/tts.ts:41](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L41)

Configuration for the Phonemizer used in Text-to-Speech models.
Phonemization is the process of converting text into phonetic representations.

## Properties

### lang

> **lang**: [`TextToSpeechLanguage`](../type-aliases/TextToSpeechLanguage.md)

Defined in: [types/tts.ts:45](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L45)

The language code for phonemization (e.g., 'en-us').

---

### lexiconSource?

> `optional` **lexiconSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:57](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L57)

Optional resource for the pronunciation lexicon.
If provided, it wil be a primary phonemization mechanism.

---

### neuralModelSource?

> `optional` **neuralModelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:64](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L64)

Optional neural model resource for Grapheme-to-Phoneme conversion.
Serves as a fallback for lexicon or a primary phonemization mechanism if lexicon
is not defined.

---

### taggerSource?

> `optional` **taggerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/tts.ts:51](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L51)

Optional resource for the part-of-speech tagger.
Utilized by more challenging languages, such as english.
