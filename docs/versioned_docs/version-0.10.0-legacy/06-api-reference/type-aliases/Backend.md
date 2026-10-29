# Type Alias: Backend

> **Backend** = `"xnnpack"` \| `"coreml"` \| `"vulkan"` \| `"qnn"`

Defined in: [constants/modelRegistry.ts:41](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelRegistry.ts#L41)

Backend options accepted by `models` accessors.

The set of backends a particular model can be loaded with is encoded in
its accessor's call signature — e.g. `models.llm.llama3_2_3b` only accepts
`'xnnpack'`, while `models.object_detection.rf_detr_nano` accepts
`'xnnpack' | 'coreml'`. Passing a backend a model doesn't ship is a
compile-time error.
