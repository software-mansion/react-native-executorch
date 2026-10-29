# Interface: PiiEntity

Defined in: [types/privacyFilter.ts:67](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L67)

A single detected PII entity span.

## Properties

### endToken

> **endToken**: `number`

Defined in: [types/privacyFilter.ts:75](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L75)

Exclusive end token index.

---

### label

> **label**: `string`

Defined in: [types/privacyFilter.ts:69](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L69)

Entity type, e.g. `private_person`, `private_email`, `secret`.

---

### startToken

> **startToken**: `number`

Defined in: [types/privacyFilter.ts:73](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L73)

Inclusive start token index in the original (unpadded) tokenization.

---

### text

> **text**: `string`

Defined in: [types/privacyFilter.ts:71](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L71)

Decoded text of the span (whitespace trimmed).
