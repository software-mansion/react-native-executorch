# Interface: SpeechToTextModelConfig

Defined in: [types/stt.ts:270](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L270)

Configuration for Speech to Text model.

## Properties

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [types/stt.ts:280](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L280)

A boolean flag indicating whether the model supports multiple languages.

***

### modelName

> **modelName**: [`SpeechToTextModelName`](../type-aliases/SpeechToTextModelName.md)

Defined in: [types/stt.ts:275](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L275)

The built-in model name (e.g. `'whisper-tiny-en'`). Used for telemetry and hook reload triggers.
Pass one of the pre-built STT constants (e.g. `WHISPER_TINY_EN`) to populate all required fields.

***

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:287](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L287)

A string that specifies the location of a `.pte` file for the model.

We expect the model to have 2 bundled methods: 'decode' and 'encode'.

***

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:292](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L292)

A string that specifies the location to the tokenizer for the model.
