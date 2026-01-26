# Interface: SpeechToTextModelConfig

Defined in: [packages/react-native-executorch/src/types/stt.ts:177](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/stt.ts#L177)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:191](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/stt.ts#L191)

A string that specifies the location of a `.pte` file for the decoder.

***

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:186](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/stt.ts#L186)

A string that specifies the location of a `.pte` file for the encoder.

***

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:181](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/stt.ts#L181)

A boolean flag indicating whether the model supports multiple languages.

***

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:196](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/stt.ts#L196)

A string that specifies the location to the tokenizer for the model.
