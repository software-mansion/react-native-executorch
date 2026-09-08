# Function: extractSpans()

> **extractSpans**(`predictedLabels`, `labelNames`): [`TokenSpan`](../interfaces/TokenSpan.md)[]

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:415](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L415)

Collapses a per-token label id sequence into same-entity spans, skipping
background (`O`) tokens. A span runs from an opener token through the
following same-entity tokens, but stops before the next opener (`B-x`/`S-x`)
so two adjacent same-type entities (e.g. `S-x` then `B-x E-x`) stay separate
rather than merging into one run.

## Parameters

### predictedLabels

`Int32Array`

Per-token predicted label ids.

### labelNames

readonly `string`[]

The BIOES label list.

## Returns

[`TokenSpan`](../interfaces/TokenSpan.md)[]

The detected token spans in order.
