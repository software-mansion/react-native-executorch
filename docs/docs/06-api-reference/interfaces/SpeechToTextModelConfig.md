# Interface: SpeechToTextModelConfig

Defined in: [packages/react-native-executorch/src/types/stt.ts:176](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/stt.ts#L176)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:190](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/stt.ts#L190)

A string that specifies the location of a `.pte` file for the decoder.

***

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:185](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/stt.ts#L185)

A string that specifies the location of a `.pte` file for the encoder.

***

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:180](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/stt.ts#L180)

A boolean flag indicating whether the model supports multiple languages.

***

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:195](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/stt.ts#L195)

A string that specifies the location to the tokenizer for the model.
