# Interface: SpeechToTextModelConfig

Defined in: [packages/react-native-executorch/src/types/stt.ts:205](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/stt.ts#L205)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:219](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/stt.ts#L219)

A string that specifies the location of a `.pte` file for the decoder.

---

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:214](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/stt.ts#L214)

A string that specifies the location of a `.pte` file for the encoder.

---

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:209](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/stt.ts#L209)

A boolean flag indicating whether the model supports multiple languages.

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:224](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/stt.ts#L224)

A string that specifies the location to the tokenizer for the model.
