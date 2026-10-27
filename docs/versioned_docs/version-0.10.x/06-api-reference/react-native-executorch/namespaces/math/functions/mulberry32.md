# Function: mulberry32()

> **mulberry32**(`seed`): () => `number`

Defined in: [extensions/math.ts:138](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/math.ts#L138)

Creates a mulberry32 pseudo-random generator producing uniform values in
`[0, 1)`. Unlike `Math.random` it accepts a seed, so a fixed seed yields a
reproducible sequence.

## Parameters

### seed

`number`

The 32-bit integer seed for the generator.

## Returns

A function returning the next uniform pseudo-random number in `[0, 1)`.

> (): `number`

### Returns

`number`
