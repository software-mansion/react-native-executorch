# Type Alias: Tensor

> **Tensor** = `object`

Defined in: [core/tensor.ts:30](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L30)

A native ExecuTorch tensor allocated in C++ memory.

Tensors are the fundamental data containers used throughout the lower-level
API. They carry a fixed data type, an immutable shape, and reside in native
heap memory — they must be explicitly released by calling
[Tensor.dispose](#dispose) when no longer needed to avoid native memory leaks.

Create tensors with the [tensor](../functions/tensor.md) factory function.

## Properties

### dtype

> `readonly` **dtype**: [`DType`](DType.md)

Defined in: [core/tensor.ts:32](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L32)

The element data type of the tensor.

---

### numel

> `readonly` **numel**: `number`

Defined in: [core/tensor.ts:36](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L36)

The total number of elements stored in the tensor.

---

### shape

> `readonly` **shape**: readonly `number`[]

Defined in: [core/tensor.ts:34](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L34)

The concrete size of each dimension (e.g., `[1, 3, 224, 224]`).

## Methods

### copyTo()

> **copyTo**(`dst`, `options?`): `Tensor`

Defined in: [core/tensor.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L53)

Copies this tensor's data into another tensor.

#### Parameters

##### dst

`Tensor`

The destination tensor to copy data into.

##### options?

Optional configuration for the copy operation.

###### length?

`number`

The number of elements to copy. Defaults to
`numel - offset`, i.e. copies from `offset` to the end of the source
tensor.

###### offset?

`number`

The start offset in elements in the source tensor.
Defaults to `0`.

#### Returns

`Tensor`

The destination tensor `dst`.

#### Throws

Thrown with code `INVALID_ARGUMENT` if the copy
bounds exceed the tensor size or data types mismatch, `RESOURCE_BUSY` if
either tensor is in use, or `RESOURCE_DISPOSED` if either tensor was
disposed.

---

### dispose()

> **dispose**(): `void`

Defined in: [core/tensor.ts:60](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L60)

Releases the underlying native C++ memory held by this tensor.

After calling `dispose`, the tensor must not be used again.

#### Returns

`void`

---

### getData()

> **getData**\<`T`\>(`dst`): `T`

Defined in: [core/tensor.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L84)

Copies data out of this tensor's native buffer into a typed array.

#### Type Parameters

##### T

`T` _extends_ `Int32Array`\<`ArrayBufferLike`\> \| `Float32Array`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\> \| `BigInt64Array`\<`ArrayBufferLike`\>

The concrete typed-array type to fill.

#### Parameters

##### dst

`T`

The destination typed array. Its size in bytes must match
tensor's size.

#### Returns

`T`

The same `dst` array, now filled with tensor data.

#### Throws

Thrown with code `INVALID_ARGUMENT` if `dst`
byte length does not match tensor size, `RESOURCE_BUSY` if the tensor is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### setData()

> **setData**(`src`): `Tensor`

Defined in: [core/tensor.ts:72](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L72)

Writes data from a typed array into this tensor's native buffer.

#### Parameters

##### src

The source typed array. Its size in bytes must match the
tensor's size. Use a `BigInt64Array` for `int64` tensors and a
`Uint8Array` for `bool` tensors.

`Int32Array`\<`ArrayBufferLike`\> | `Float32Array`\<`ArrayBufferLike`\> | `Uint8Array`\<`ArrayBufferLike`\> | `BigInt64Array`\<`ArrayBufferLike`\>

#### Returns

`Tensor`

`this` tensor.

#### Throws

Thrown with code `INVALID_ARGUMENT` if `src`
byte length does not match tensor size, `RESOURCE_BUSY` if the tensor is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### through()

> **through**\<`R`, `Args`\>(`fn`, ...`args`): `R`

Defined in: [core/tensor.ts:94](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L94)

Passes `this` tensor as the first argument to `fn` and returns the result.

#### Type Parameters

##### R

`R`

The return type of `fn`.

##### Args

`Args` _extends_ `any`[]

The types of any additional arguments forwarded to `fn`.

#### Parameters

##### fn

(`t`, ...`args`) => `R`

The function to invoke with `(this, ...args)`.

##### args

...`Args`

Additional arguments forwarded to `fn`.

#### Returns

`R`

The return value of `fn`.

---

### throughIf()

> **throughIf**\<`Args`\>(`pred`, `fn`, ...`args`): `Tensor`

Defined in: [core/tensor.ts:106](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/tensor.ts#L106)

Conditionally applies `fn` to `this` tensor when `pred` is `true`,
otherwise returns `this` unchanged.

#### Type Parameters

##### Args

`Args` _extends_ `any`[]

The types of any additional arguments forwarded to `fn`.

#### Parameters

##### pred

`boolean`

When `true`, calls `fn(this, ...args)` and returns the result.
When `false`, returns `this` unchanged.

##### fn

(`t`, ...`args`) => `Tensor`

The function to invoke when `pred` is `true`.

##### args

...`Args`

Additional arguments forwarded to `fn`.

#### Returns

`Tensor`

The result of `fn` when `pred` is `true`, or `this` otherwise.
