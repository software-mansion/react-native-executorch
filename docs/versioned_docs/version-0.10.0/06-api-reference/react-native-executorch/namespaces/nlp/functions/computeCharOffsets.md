# Function: computeCharOffsets()

> **computeCharOffsets**(`tokenizer`, `ids`): `Uint32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:463](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L463)

Computes per-token UTF-16 character offsets into the original input, so a
span of tokens `[start, end)` can be sliced back out of the source with
`input.slice(offsets[start * 2], offsets[(end - 1) * 2 + 1])`.

Assumes a byte-level BPE tokenizer with no lossy normalization (the openai
and nemotron privacy filter presets satisfy this): decoding the full token
sequence must reproduce the input string exactly. Under that guarantee, the
length of `decode(ids[0..k])` (see: [Tokenizer.decode](../type-aliases/Tokenizer.md#decode)) is the
character offset just past token `k-1`.

Runs `ids.length` `decode` calls, each on a growing prefix. Cheap for the
~256-token windows the privacy filter operates on; keep in mind for larger
sequences.

## Parameters

### tokenizer

[`Tokenizer`](../type-aliases/Tokenizer.md)

Same tokenizer instance used to produce `ids`.

### ids

`Int32Array`

Token ids for the whole input.

## Returns

`Uint32Array`

A flat `[start0, end0, start1, end1, ...]` `Uint32Array` of length
`2 * ids.length`.
