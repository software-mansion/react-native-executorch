# Function: repeatInterleave()

> **repeatInterleave**\<`T`\>(`values`, `repeats`): `T`

Defined in: [extensions/math.ts:198](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L198)

Repeats each element of `values` as many times as the matching entry of
`repeats`, concatenating the runs into a newly allocated array of the same
kind — the equivalent of PyTorch's `repeat_interleave` over a 1-D input.

Non-positive repeat counts drop their element.

## Type Parameters

### T

`T` _extends_ `ArrayLike`\<`number`\> \| `ArrayLike`\<`bigint`\>

The array kind of `values` (any typed array or a plain array),
preserved in the result.

## Parameters

### values

`T`

The values to repeat.

### repeats

`ArrayLike`\<`number`\>

The repeat count for each value. Must be the same length as
`values`.

## Returns

`T`

A new array of the same kind holding the repeated runs.

## Throws

With code `INVALID_ARGUMENT` if `repeats` and
`values` have different lengths.
