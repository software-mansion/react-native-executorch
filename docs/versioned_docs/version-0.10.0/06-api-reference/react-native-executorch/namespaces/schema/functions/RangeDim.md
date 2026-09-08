# Function: RangeDim()

> **RangeDim**(`min`, `max`, `step?`): [`ConcreteDim`](../type-aliases/ConcreteDim.md)

Defined in: [core/schema.ts:294](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L294)

Creates a range dimension matching values from `min` to `max` in increments
of `step`.

## Parameters

### min

`number`

The smallest allowed dimension size.

### max

`number`

The largest allowed dimension size.

### step?

`number`

The increment between allowed sizes. Defaults to 1.

## Returns

[`ConcreteDim`](../type-aliases/ConcreteDim.md)

The concrete dimension.

## Throws

With code `INVALID_ARGUMENT` if the range
bounds or step are not valid positive integers.
