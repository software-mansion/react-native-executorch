# Function: buildGrammar()

> **buildGrammar**(`labelNames`, `biases?`): [`Grammar`](../interfaces/Grammar.md)

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:146](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L146)

Builds the grouped BIOES grammar for a label space. Called once at pipeline
construction (not on the worklet thread), so the per-token decode loop only
reads the pre-computed [Grammar](../interfaces/Grammar.md).

The encoded grammar is:

- `O` / `E-x` / `S-x` -> `O` | `B-y` | `S-y`
- `B-x` / `I-x` -> `I-x` | `E-x` (same entity)

## Parameters

### labelNames

readonly `string`[]

BIOES label list; index 0 must be `'O'`.

### biases?

[`ViterbiBiases`](../interfaces/ViterbiBiases.md)

Optional transition biases; missing fields default to `0`.

## Returns

[`Grammar`](../interfaces/Grammar.md)

The pre-computed grammar.
