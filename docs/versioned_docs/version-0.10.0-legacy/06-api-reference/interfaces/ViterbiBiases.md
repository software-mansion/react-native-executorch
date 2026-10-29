# Interface: ViterbiBiases

Defined in: [types/privacyFilter.ts:22](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L22)

Six Viterbi transition biases that match the operating-point schema
from the openai/privacy-filter `viterbi_calibration.json`. Each value
is added to the decoder score whenever the corresponding BIOES
transition is taken.

Positive values _encourage_ the transition; negative values discourage
it. Defaults are zero (neutral validity-only Viterbi).

## Properties

### backgroundStay?

> `optional` **backgroundStay**: `number`

Defined in: [types/privacyFilter.ts:24](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L24)

O -> O (background persistence). Higher = stay in background more, fewer false positives.

---

### backgroundToStart?

> `optional` **backgroundToStart**: `number`

Defined in: [types/privacyFilter.ts:26](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L26)

O -> B-_ / S-_ (span entry). Lower (negative) = enter spans more eagerly, higher recall.

---

### endToBackground?

> `optional` **endToBackground**: `number`

Defined in: [types/privacyFilter.ts:28](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L28)

E-/S-\* -> O (span closure to background).

---

### endToStart?

> `optional` **endToStart**: `number`

Defined in: [types/privacyFilter.ts:30](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L30)

E-/S-_ -> B-_ / S-\* (back-to-back spans).

---

### insideToContinue?

> `optional` **insideToContinue**: `number`

Defined in: [types/privacyFilter.ts:32](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L32)

B-/I-X -> I-X (span continuation). Higher = longer spans.

---

### insideToEnd?

> `optional` **insideToEnd**: `number`

Defined in: [types/privacyFilter.ts:34](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L34)

B-/I-X -> E-X (span closure). Higher = shorter spans.
