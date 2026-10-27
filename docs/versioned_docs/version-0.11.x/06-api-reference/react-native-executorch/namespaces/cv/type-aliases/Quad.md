# Type Alias: Quad

> **Quad** = readonly \[[`Point`](Point.md), [`Point`](Point.md), [`Point`](Point.md), [`Point`](Point.md)\]

Defined in: [extensions/cv/ops/quad.ts:20](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L20)

A quadrilateral in pixel space: exactly four corners, in no guaranteed order.
Helpers that need them as top-left, top-right, bottom-right, bottom-left say
so on their `ordered` parameter; pass the quad through [orderQuad](../functions/orderQuad.md)
first. Never assume a `Quad` you were handed is already ordered.
