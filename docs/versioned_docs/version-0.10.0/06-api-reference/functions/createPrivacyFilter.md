# Function: createPrivacyFilter()

> **createPrivacyFilter**\<`Label`\>(`config`, `runtime?`): `Promise`\<[`PrivacyFilter`](../type-aliases/PrivacyFilter.md)\<`Label`\>\>

Defined in: [extensions/nlp/tasks/privacyFilter.ts:129](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L129)

Creates a privacy filter runner that detects personally identifiable
information (PII) spans in text.

It loads the tokenizer and model, validates the `forward` signature against
the configured label space, pre-computes the BIOES grammar tables, and
registers clean disposal hooks to clear all native memory.

Works with any privacy-filter-style model exporting
`forward(input_ids, attention_mask) -> logits` over a BIOES label space.
Inputs longer than the model's exported window are processed in sliding
windows with 50% overlap and never truncated; predictions near a window's
edges are discarded in favor of the neighboring window's more centered
context.

## Type Parameters

### Label

`Label` _extends_ `string`

The model's BIOES label space.

## Parameters

### config

[`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`Label`\>

Privacy filter task configuration containing the model and
tokenizer paths plus the label space options. See [PrivacyFilterModel](../type-aliases/PrivacyFilterModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`PrivacyFilter`](../type-aliases/PrivacyFilter.md)\<`Label`\>\>

A promise resolving to the instantiated [PrivacyFilter](../type-aliases/PrivacyFilter.md) runner.

## Throws

With code `INVALID_ARGUMENT` if `labelNames` is
empty or does not start with `'O'`, `LOAD_FAILED` if the model or tokenizer
fails to load, or `SCHEMA_MISMATCH` if the loaded model schema does not match
the privacy filter specification.
