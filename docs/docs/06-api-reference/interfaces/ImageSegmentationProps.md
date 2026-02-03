# Interface: ImageSegmentationProps

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:43](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/imageSegmentation.ts#L43)

Props for the `useImageSegmentation` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:44](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/imageSegmentation.ts#L44)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:45](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/imageSegmentation.ts#L45)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
