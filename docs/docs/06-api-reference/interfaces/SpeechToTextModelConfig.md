# Interface: SpeechToTextModelConfig

Defined in: [packages/react-native-executorch/src/types/stt.ts:201](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/stt.ts#L201)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:215](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/stt.ts#L215)

A string that specifies the location of a `.pte` file for the decoder.

***

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:210](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/stt.ts#L210)

A string that specifies the location of a `.pte` file for the encoder.

***

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:205](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/stt.ts#L205)

A boolean flag indicating whether the model supports multiple languages.

***

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:220](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/stt.ts#L220)

A string that specifies the location to the tokenizer for the model.
