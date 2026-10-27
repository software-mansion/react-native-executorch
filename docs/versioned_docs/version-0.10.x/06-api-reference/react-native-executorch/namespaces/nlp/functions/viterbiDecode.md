# Function: viterbiDecode()

> **viterbiDecode**(`logits`, `validLen`, `grammar`, `constrainEnd?`): `Int32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:223](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L223)

Runs constrained Viterbi over a `[validLen, numLabels]` slice of per-token
logits and returns the best BIOES-grammar-valid label-id sequence (length
`validLen`).

## Parameters

### logits

`Float32Array`

Flat row-major logits; row `t` starts at `t * numLabels`.

### validLen

`number`

Number of leading token rows to decode.

### grammar

[`Grammar`](../interfaces/Grammar.md)

Pre-computed grammar tables from [buildGrammar](buildGrammar.md).

### constrainEnd?

`boolean` = `false`

When `true`, the decoded sequence is forced to end on a
valid BIOES terminal (`O`/`E-x`/`S-x`) rather than an open span (`B-x`/`I-x`).
Pass `true` only when this slice ends where the text ends; a slice cut mid-span
(e.g. an interior sliding window) should leave this `false`. Defaults to
`false`.

## Returns

`Int32Array`

The most likely label id per token.
