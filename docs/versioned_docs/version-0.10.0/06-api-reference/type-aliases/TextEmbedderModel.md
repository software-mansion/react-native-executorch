# Type Alias: TextEmbedderModel

> **TextEmbedderModel** = `object`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:27](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L27)

Model configuration required to instantiate a text embedder task runner.

## Properties

### defaultPrompt?

> `readonly` `optional` **defaultPrompt**: `string`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L33)

Optional default prompt prefix added to input text before embedding.

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:29](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L29)

Local path or remote URL of the `.pte` model file.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:31](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L31)

Local path or remote URL of the tokenizer file.
