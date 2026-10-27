# Type Alias: Landmark

> **Landmark** = [`Point`](../react-native-executorch/namespaces/cv/type-aliases/Point.md) & `object`

Defined in: [extensions/cv/tasks/keypointDetection.ts:79](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L79)

A single landmark: where it sits in the input image, how sure the model is of
it, and — only for models that regress depth — how far it lies from the
subject's own plane.

## Type Declaration

### confidence

> `readonly` **confidence**: `number`

Confidence score of this landmark (between 0.0 and 1.0).

### depth?

> `readonly` `optional` **depth**: `number`

Relative depth, on the same scale as `x`, negative towards the camera.
Present only for models whose keypoint output carries a fourth channel;
`undefined` for the flat ones.
