# Interface: PixelData

Defined in: [types/common.ts:165](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L165)

Represents raw pixel data in RGB format for vision models.

This type extends TensorPtr with constraints specific to image data:
- dataPtr must be Uint8Array (8-bit unsigned integers)
- scalarType is always BYTE (ScalarType.BYTE)
- sizes represents [height, width, channels] where channels must be 3 (RGB)

## Example

```typescript
const pixelData: PixelData = {
  dataPtr: new Uint8Array(width * height * 3), // RGB pixel data
  sizes: [height, width, 3], // [height, width, channels]
  scalarType: ScalarType.BYTE
};
```

## Extends

- `Pick`\<[`TensorPtr`](TensorPtr.md), `"sizes"`\>

## Properties

### dataPtr

> **dataPtr**: `Uint8Array`

Defined in: [types/common.ts:171](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L171)

RGB pixel data as Uint8Array.
Expected format: RGB (3 channels), not RGBA or BGRA.
Size must equal: width * height * 3

***

### scalarType

> **scalarType**: [`BYTE`](../enumerations/ScalarType.md#byte)

Defined in: [types/common.ts:184](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L184)

Scalar type is always BYTE for pixel data.

***

### sizes

> **sizes**: \[`number`, `number`, `3`\]

Defined in: [types/common.ts:179](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L179)

Dimensions of the pixel data: [height, width, channels].
- sizes[0]: height (number of rows)
- sizes[1]: width (number of columns)
- sizes[2]: channels (must be 3 for RGB)

#### Overrides

[`TensorPtr`](TensorPtr.md).[`sizes`](TensorPtr.md#sizes)
