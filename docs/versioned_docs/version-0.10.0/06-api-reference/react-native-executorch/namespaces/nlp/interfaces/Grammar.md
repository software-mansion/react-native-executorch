# Interface: Grammar

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:94](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L94)

Pre-computed BIOES grammar consumed by [viterbiDecode](../functions/viterbiDecode.md).

Rather than an `N x N` transition matrix, the grammar is stored as the small
set of groups the transition rules actually depend on. Under BIOES every
target's best predecessor comes from one of three group maxima — the best
background state, the best span-closing (`E-`/`S-`) state, or, per entity,
the best of that entity's `B-`/`I-` states — which is what lets the decode
step run in `O(numLabels + numEntities)` instead of `O(numLabels^2)`.

## Properties

### biases

> `readonly` **biases**: `Required`\<[`ViterbiBiases`](ViterbiBiases.md)\>

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:114](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L114)

Transition biases, with every optional field resolved to its default.

---

### bOf

> `readonly` **bOf**: `Int32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L108)

Per entity, the index of its `B-` label, or `-1`.

---

### entityOf

> `readonly` **entityOf**: `Int32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:102](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L102)

Entity group id per label; `-1` for background labels.

---

### esLabels

> `readonly` **esLabels**: `Int32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:106](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L106)

Indices of all span-closing (`E-`/`S-`) labels.

---

### iOf

> `readonly` **iOf**: `Int32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:110](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L110)

Per entity, the index of its `I-` label, or `-1`.

---

### labelClass

> `readonly` **labelClass**: `Int8Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:100](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L100)

Role class per label (`CLASS_O`/`B`/`I`/`E`/`S`).

---

### numEntities

> `readonly` **numEntities**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:98](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L98)

Number of entity types (each contributing its `B`/`I`/`E`/`S` labels).

---

### numLabels

> `readonly` **numLabels**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:96](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L96)

Total number of labels, i.e. `1 + 4 * numEntities`.

---

### oLabels

> `readonly` **oLabels**: `Int32Array`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:104](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L104)

Indices of all background (`O`-class) labels.

---

### validStart

> `readonly` **validStart**: `boolean`[]

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:112](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L112)

`true` iff the label is a legal first-token label (`O`, `B-x`, `S-x`).
