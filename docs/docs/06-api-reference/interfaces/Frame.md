# Interface: Frame

Defined in: [types/common.ts:197](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/common.ts#L197)

Frame data for vision model processing.

## Methods

### getNativeBuffer()

> **getNativeBuffer**(): `object`

Defined in: [types/common.ts:205](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/common.ts#L205)

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
