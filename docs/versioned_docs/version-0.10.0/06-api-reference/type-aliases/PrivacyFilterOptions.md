# Type Alias: PrivacyFilterOptions\<Label\>

> **PrivacyFilterOptions**\<`Label`\> = `object`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:40](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L40)

Options describing a privacy filter model's label space and decoding
behavior.

## Type Parameters

### Label

`Label` _extends_ `string` = `string`

The model's BIOES label space, defined alongside the model
in the `models` registry.

## Properties

### labelNames

> `readonly` **labelNames**: readonly `Label`[]

Defined in: [extensions/nlp/tasks/privacyFilter.ts:45](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L45)

BIOES label list matching the model's `id2label` mapping exactly; index 0
must be `'O'`.

---

### padTokenId

> `readonly` **padTokenId**: `number`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:56](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L56)

Token id used to pad the final window of a static (fixed-length) model,
masked out via the attention mask. For the o200k tokenizer this is the
`<|endoftext|>` id.

---

### viterbiBiases?

> `readonly` `optional` **viterbiBiases**: [`ViterbiBiases`](../react-native-executorch/namespaces/nlp/interfaces/ViterbiBiases.md)

Defined in: [extensions/nlp/tasks/privacyFilter.ts:50](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L50)

Transition biases applied while decoding. Defaults to neutral
(validity-only) Viterbi.
