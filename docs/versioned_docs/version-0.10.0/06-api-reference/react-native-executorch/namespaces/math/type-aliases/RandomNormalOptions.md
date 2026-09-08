# Type Alias: RandomNormalOptions

> **RandomNormalOptions** = `object`

Defined in: [extensions/math.ts:13](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L13)

Configuration options for normal distribution random number generation.

## Properties

### mean?

> `readonly` `optional` **mean**: `number`

Defined in: [extensions/math.ts:15](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L15)

The mean of the distribution.

---

### seed?

> `readonly` `optional` **seed**: `number`

Defined in: [extensions/math.ts:22](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L22)

The seed for the underlying generator. When omitted, a random seed is
generated so different values are produced each call.

---

### std?

> `readonly` `optional` **std**: `number`

Defined in: [extensions/math.ts:17](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L17)

The standard deviation of the distribution.
