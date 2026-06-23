# Type Alias: EmbeddingRole

> **EmbeddingRole** = `"query"` \| `"document"`

Defined in: [types/textEmbeddings.ts:42](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L42)

Role for `forward`. Some models are trained with asymmetric query/document
prompts (e.g. LFM2.5 uses `query: `/`document: `, ColBERT uses `[Q] `/`[D] `).
Passing a role auto-prepends the model's configured prompt for that role.
