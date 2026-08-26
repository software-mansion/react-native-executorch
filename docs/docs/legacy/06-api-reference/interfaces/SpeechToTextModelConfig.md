# Interface: SpeechToTextModelConfig

Defined in: [types/stt.ts:287](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L287)

Configuration for Speech to Text model.

## Properties

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [types/stt.ts:297](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L297)

A boolean flag indicating whether the model supports multiple languages.

---

### modelName

> **modelName**: [`SpeechToTextModelName`](../type-aliases/SpeechToTextModelName.md)

Defined in: [types/stt.ts:292](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L292)

The built-in model name (e.g. `'whisper-tiny-en'`). Used for telemetry and hook reload triggers.
Pass one of the pre-built STT constants (e.g. `WHISPER_TINY_EN`) to populate all required fields.

---

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:304](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L304)

A string that specifies the location of a `.pte` file for the model.

We expect the model to have 2 bundled methods: 'decode' and 'encode'.

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:309](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L309)

A string that specifies the location to the tokenizer for the model.
