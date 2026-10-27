# Type Alias: NormalizeOptions

> **NormalizeOptions** = `object`

Defined in: [extensions/cv/ops/image.ts:97](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L97)

Configuration options for image tensor normalization.

## Properties

### alpha?

> `readonly` `optional` **alpha**: `number` \| readonly `number`[]

Defined in: [extensions/cv/ops/image.ts:102](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L102)

Multiplicative coefficient applied as `pixel * alpha`. Single value for
uniform scaling across all channels, or per-channel array.

---

### beta?

> `readonly` `optional` **beta**: `number` \| readonly `number`[]

Defined in: [extensions/cv/ops/image.ts:107](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L107)

Additive offset applied as `pixel * alpha + beta`. Single value or
per-channel array.
