# Function: tensor()

> **tensor**(`dtype`, `shape`, `src?`): [`Tensor`](../type-aliases/Tensor.md)

Defined in: [core/tensor.ts:147](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L147)

Allocates a new native tensor with the specified data type and shape.

Optionally initializes the tensor's buffer from a typed array `src`. When
`src` is omitted the buffer contents are undefined. The returned tensor
resides in native C++ memory; call [Tensor.dispose](../type-aliases/Tensor.md#dispose) when the tensor is
no longer needed.

## Parameters

### dtype

[`DType`](../type-aliases/DType.md)

The element data type of the tensor.

### shape

`number`[]

An array of dimension sizes (e.g. `[1, 3, 224, 224]`).

### src?

Optional typed array used to initialize the tensor's data. Its
size in bytes must match tensor's size.

`Int32Array`\<`ArrayBufferLike`\> | `Float32Array`\<`ArrayBufferLike`\> | `Uint8Array`\<`ArrayBufferLike`\> | `BigInt64Array`\<`ArrayBufferLike`\>

## Returns

[`Tensor`](../type-aliases/Tensor.md)

A newly allocated native tensor.

## Throws

Thrown with code `INVALID_ARGUMENT` if any
dimension in `shape` is non-positive or if `src` byte length does not match
the allocated tensor size.

## Example

```typescript
const t = tensor('float32', [1, 4], new Float32Array([1.0, 2.0, 3.0, 4.0]));
try {
  const data = t.getData(new Float32Array(4));
  console.log(data); // Float32Array [1, 2, 3, 4]
} finally {
  t.dispose();
}
```
