# Interface: Frame

Defined in: [types/common.ts:190](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/common.ts#L190)

Frame data for vision model processing.

## Properties

### isMirrored

> **isMirrored**: `boolean`

Defined in: [types/common.ts:200](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/common.ts#L200)

---

### orientation

> **orientation**: `string`

Defined in: [types/common.ts:199](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/common.ts#L199)

## Methods

### getNativeBuffer()

> **getNativeBuffer**(): `object`

Defined in: [types/common.ts:198](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/common.ts#L198)

Pointer to native platform buffer (zero-copy, best performance).

- On iOS: CVPixelBufferRef pointer
- On Android: AHardwareBuffer\* pointer

Obtain from Vision Camera v5: `frame.getNativeBuffer().pointer`

#### Returns

`object`

##### pointer

> **pointer**: `bigint`

##### release()

> **release**(): `void`

###### Returns

`void`
