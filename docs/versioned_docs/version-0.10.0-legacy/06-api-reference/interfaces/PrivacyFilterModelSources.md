# Interface: PrivacyFilterModelSources

Defined in: [types/privacyFilter.ts:44](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L44)

Bundle of resources needed to instantiate a privacy filter model. The
built-in `PRIVACY_FILTER_OPENAI` / `PRIVACY_FILTER_NEMOTRON` constants
conform to this shape; you can also build one yourself for a custom
fine-tune as long as the label list matches the model's id2label.

## Properties

### labelNames

> **labelNames**: readonly `string`[]

Defined in: [types/privacyFilter.ts:53](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L53)

BIOES label list. Index 0 must be "O"; index i must equal the model's
id2label[i]. The runner argmaxes over `labelNames.length` classes per
token, so the size must match the model head exactly.

---

### modelName

> **modelName**: [`PrivacyFilterModelName`](../type-aliases/PrivacyFilterModelName.md) \| `string` & `object`

Defined in: [types/privacyFilter.ts:45](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L45)

---

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/privacyFilter.ts:46](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L46)

---

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/privacyFilter.ts:47](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L47)

---

### viterbiBiases?

> `optional` **viterbiBiases**: [`ViterbiBiases`](ViterbiBiases.md)

Defined in: [types/privacyFilter.ts:60](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L60)

Optional Viterbi calibration. When present, biases are added during
decoding to shift the precision/recall tradeoff. Defaults to all
zeros (neutral) — same as the `default` operating point in OpenAI's
`viterbi_calibration.json`.
