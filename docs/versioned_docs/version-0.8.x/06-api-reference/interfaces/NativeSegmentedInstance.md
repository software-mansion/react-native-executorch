# Interface: NativeSegmentedInstance

Defined in: [types/instanceSegmentation.ts:10](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L10)

**`Internal`**

Raw instance returned from the native C++ side, carrying a numeric
`classIndex` instead of a resolved label string.

## Properties

### bbox

> **bbox**: [`Bbox`](Bbox.md)

Defined in: [types/instanceSegmentation.ts:11](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L11)

***

### classIndex

> **classIndex**: `number`

Defined in: [types/instanceSegmentation.ts:15](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L15)

***

### mask

> **mask**: `Uint8Array`

Defined in: [types/instanceSegmentation.ts:12](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L12)

***

### maskHeight

> **maskHeight**: `number`

Defined in: [types/instanceSegmentation.ts:14](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L14)

***

### maskWidth

> **maskWidth**: `number`

Defined in: [types/instanceSegmentation.ts:13](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L13)

***

### score

> **score**: `number`

Defined in: [types/instanceSegmentation.ts:16](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L16)
