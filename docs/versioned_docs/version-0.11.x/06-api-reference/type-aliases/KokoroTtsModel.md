# Type Alias: KokoroTtsModel\<K\>

> **KokoroTtsModel**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:76](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L76)

Model configuration required to instantiate the Kokoro Text-to-Speech pipeline.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice keys record constraint (strictly inferred from voices keys).

## Properties

### modelPaths

> `readonly` **modelPaths**: `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:80](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L80)

Local or remote file paths to the 2 Kokoro `.pte` sub-models.

#### durationPredictor

> `readonly` **durationPredictor**: `string`

Path to the duration predictor `.pte` model.

#### synthesizer

> `readonly` **synthesizer**: `string`

Path to the synthesizer `.pte` model.

---

### name

> `readonly` **name**: `"kokoro"`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:78](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L78)

Discriminates this config from the other Text-to-Speech pipelines.

---

### phonemizer

> `readonly` **phonemizer**: [`PhonemizerConfig`](../react-native-executorch/namespaces/speech/type-aliases/PhonemizerConfig.md)

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:87](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L87)

Grapheme-to-phoneme configuration matching the model's language.

---

### voices

> `readonly` **voices**: `Record`\<`K`, `string`\>

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:89](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L89)

Map of voice names to local or remote voice `.bin` file paths.
