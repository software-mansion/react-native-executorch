# Interface: ObjectDetectionProps

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:140](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/objectDetection.ts#L140)

Props for the `useObjectDetection` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:141](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/objectDetection.ts#L141)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:142](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/objectDetection.ts#L142)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
