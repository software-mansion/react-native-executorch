# Interface: SpeechToTextModelConfig

Defined in: [types/stt.ts:263](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L263)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:277](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L277)

A string that specifies the location of a `.pte` file for the decoder.

---

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:272](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L272)

A string that specifies the location of a `.pte` file for the encoder.

---

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [types/stt.ts:267](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L267)

A boolean flag indicating whether the model supports multiple languages.

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:282](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L282)

A string that specifies the location to the tokenizer for the model.
