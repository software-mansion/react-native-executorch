# Interface: PiiEntity\<Label\>

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:57](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L57)

A single detected PII entity span.

## Type Parameters

### Label

`Label` _extends_ `string` = `string`

The entity type, narrowed to a specific model's entity types
when known (see [PiiEntityType](../type-aliases/PiiEntityType.md)), or `string` for an arbitrary model.

## Properties

### charEnd

> `readonly` **charEnd**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:72](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L72)

Exclusive UTF-16 character index of the span in the original input.

---

### charStart

> `readonly` **charStart**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:70](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L70)

Inclusive UTF-16 character index of the span in the original input, i.e.
`input.slice(charStart, charEnd)` returns the span text (before trimming).

---

### endToken

> `readonly` **endToken**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:65](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L65)

Exclusive end token index.

---

### label

> `readonly` **label**: `Label`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:59](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L59)

Entity type, e.g. `private_person`, `private_email`, `secret`.

---

### startToken

> `readonly` **startToken**: `number`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:63](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L63)

Inclusive start token index in the original (unpadded) tokenization.

---

### text

> `readonly` **text**: `string`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:61](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L61)

Decoded text of the span (whitespace trimmed).
