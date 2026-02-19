# Interface: SpeechToTextModelConfig

Defined in: [packages/react-native-executorch/src/types/stt.ts:266](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L266)

Configuration for Speech to Text model.

## Properties

### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:280](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L280)

A string that specifies the location of a `.pte` file for the decoder.

---

### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:275](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L275)

A string that specifies the location of a `.pte` file for the encoder.

---

### isMultilingual

> **isMultilingual**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:270](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L270)

A boolean flag indicating whether the model supports multiple languages.

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:285](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L285)

A string that specifies the location to the tokenizer for the model.
