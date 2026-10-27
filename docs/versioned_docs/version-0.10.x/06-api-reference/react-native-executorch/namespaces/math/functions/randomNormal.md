# Function: randomNormal()

> **randomNormal**(`size`, `options?`): `Float32Array`

Defined in: [extensions/math.ts:164](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L164)

Draws normally distributed values using the Box–Muller transform, seeded via
[mulberry32](mulberry32.md) so a fixed `seed` reproduces the same sequence.

## Parameters

### size

`number`

The number of values to draw.

### options?

[`RandomNormalOptions`](../type-aliases/RandomNormalOptions.md)

Distribution parameters. When options or any individual
properties are omitted, defaults to `mean: 0`, `std: 1`, and a random seed.
See [RandomNormalOptions](../type-aliases/RandomNormalOptions.md).

## Returns

`Float32Array`

A `Float32Array` of `size` normally distributed values.
