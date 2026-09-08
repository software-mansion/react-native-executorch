# Type Alias: PrivacyFilterModel\<Label\>

> **PrivacyFilterModel**\<`Label`\> = `object`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:64](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L64)

Model configuration required to instantiate a privacy filter task runner.

## Type Parameters

### Label

`Label` _extends_ `string` = `string`

The model's BIOES label space.

## Properties

### modelOpts

> `readonly` **modelOpts**: [`PrivacyFilterOptions`](PrivacyFilterOptions.md)\<`Label`\>

Defined in: [extensions/nlp/tasks/privacyFilter.ts:73](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L73)

Label space and decoding options, defined alongside the model in the
`models` registry.

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:66](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L66)

Local path or remote URL of the `.pte` model.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:68](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L68)

Local path or remote URL of the matching `tokenizer.json`.
