# Type Alias: NormalizeOptions

> **NormalizeOptions** = `object`

Defined in: [extensions/cv/ops/image.ts:97](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L97)

Configuration options for image tensor normalization.

## Properties

### alpha?

> `readonly` `optional` **alpha**: `number` \| readonly `number`[]

Defined in: [extensions/cv/ops/image.ts:102](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L102)

Multiplicative coefficient applied as `pixel * alpha`. Single value for
uniform scaling across all channels, or per-channel array.

---

### beta?

> `readonly` `optional` **beta**: `number` \| readonly `number`[]

Defined in: [extensions/cv/ops/image.ts:107](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L107)

Additive offset applied as `pixel * alpha + beta`. Single value or
per-channel array.
