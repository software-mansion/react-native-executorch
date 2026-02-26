# Interface: SpeechToTextModelConfig

Defined in: [types/stt.ts:255](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L255)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:269](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L269)

A string that specifies the location of a `.pte` file for the decoder.

---

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:264](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L264)

A string that specifies the location of a `.pte` file for the encoder.

---

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [types/stt.ts:259](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L259)

A boolean flag indicating whether the model supports multiple languages.

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/stt.ts:274](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L274)

A string that specifies the location to the tokenizer for the model.
