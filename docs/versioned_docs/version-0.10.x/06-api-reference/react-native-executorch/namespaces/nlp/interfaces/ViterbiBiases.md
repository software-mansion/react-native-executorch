# Interface: ViterbiBiases

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:26](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L26)

Six Viterbi transition biases matching the openai/privacy-filter
`viterbi_calibration.json` schema (hosted at
https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-openai/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/viterbi_calibration.json).
Each value is added to the decoder score whenever the corresponding BIOES
transition is taken. Positive values encourage the transition; negative
values discourage it. Every field defaults to `0` (a neutral, validity-only
Viterbi).

## Properties

### backgroundStay?

> `readonly` `optional` **backgroundStay**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:28](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L28)

`O -> O` (background persistence). Higher = stay in background more, fewer false positives.

---

### backgroundToStart?

> `readonly` `optional` **backgroundToStart**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:30](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L30)

`O -> B-x`/`S-x` (span entry). Lower (negative) = enter spans more eagerly, higher recall.

---

### endToBackground?

> `readonly` `optional` **endToBackground**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:32](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L32)

`E-x`/`S-x` `-> O` (span closure to background).

---

### endToStart?

> `readonly` `optional` **endToStart**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:34](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L34)

`E-x`/`S-x` `-> B-y`/`S-y` (back-to-back spans).

---

### insideToContinue?

> `readonly` `optional` **insideToContinue**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:36](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L36)

`B-x`/`I-x` `-> I-x` (span continuation). Higher = longer spans.

---

### insideToEnd?

> `readonly` `optional` **insideToEnd**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:38](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L38)

`B-x`/`I-x` `-> E-x` (span closure). Higher = shorter spans.
