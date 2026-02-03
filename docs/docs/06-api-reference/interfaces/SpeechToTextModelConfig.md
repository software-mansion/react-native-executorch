# Interface: SpeechToTextModelConfig

Defined in: [packages/react-native-executorch/src/types/stt.ts:207](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/stt.ts#L207)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:221](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/stt.ts#L221)

A string that specifies the location of a `.pte` file for the decoder.

---

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:216](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/stt.ts#L216)

A string that specifies the location of a `.pte` file for the encoder.

---

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:211](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/stt.ts#L211)

A boolean flag indicating whether the model supports multiple languages.

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:226](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/stt.ts#L226)

A string that specifies the location to the tokenizer for the model.
