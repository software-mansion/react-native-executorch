# Type Alias: ColbertEmbedderOptions

> **ColbertEmbedderOptions** = `object`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:30](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L30)

Tokenization settings of a ColBERT model, as found in the
`config_sentence_transformers.json` that
[PyLate](https://github.com/lightonai/pylate), the library ColBERT models
are trained and published with, saves next to the weights.

## Properties

### bosToken?

> `readonly` `optional` **bosToken**: `string`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:55](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L55)

Token prepended to every input, e.g. `'<|startoftext|>'`. Omit when the model has none.

---

### documentPrefixToken

> `readonly` **documentPrefixToken**: `string`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:40](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L40)

Token inserted right after the BOS token of every document
(`document_prefix`, e.g. `'[D] '`). Must be a single vocabulary token.

---

### queryExpansionToken

> `readonly` **queryExpansionToken**: `string`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:53](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L53)

Token that pads queries up to [ColbertEmbedderOptions.queryLength](#querylength)
(query augmentation). Padding is masked out of attention, but its output
vectors are kept and take part in scoring.

---

### queryLength

> `readonly` **queryLength**: `number`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:47](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L47)

Length of every query in tokens, special tokens included
(`query_length`). Shorter queries are padded to it with
[ColbertEmbedderOptions.queryExpansionToken](#queryexpansiontoken); longer ones are
truncated.

---

### queryPrefixToken

> `readonly` **queryPrefixToken**: `string`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:35](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L35)

Token inserted right after the BOS token of every query (`query_prefix`,
e.g. `'[Q] '`). Must be a single vocabulary token.

---

### skiplistTokens

> `readonly` **skiplistTokens**: readonly `string`[]

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:61](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L61)

Tokens whose vectors are dropped from document embeddings
(`skiplist_words`, usually punctuation). Tokens missing from the
vocabulary are ignored.
