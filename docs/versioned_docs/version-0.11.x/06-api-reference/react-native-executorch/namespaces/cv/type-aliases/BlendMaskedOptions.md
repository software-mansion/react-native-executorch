# Type Alias: BlendMaskedOptions

> **BlendMaskedOptions** = `object`

Defined in: [extensions/cv/ops/image.ts:273](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L273)

Options softening the mask edge in [blendMasked](../functions/blendMasked.md).

## Properties

### feather?

> `readonly` `optional` **feather**: `number`

Defined in: [extensions/cv/ops/image.ts:286](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L286)

Size in pixels of the Gaussian kernel that feathers the mask edge. The
ramp runs inward from the edge, so pixels outside the mask are never
touched. Must be odd; `0` keeps the edge hard. Default `0`.

---

### shrink?

> `readonly` `optional` **shrink**: `number`

Defined in: [extensions/cv/ops/image.ts:280](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L280)

Pixels to erode the masked region by before feathering, so the seam sits
inside the region rather than on its edge. A region thinner than
`2 * shrink + 1` px would erode to nothing, so such a mask is used as is.
Default `0`.
