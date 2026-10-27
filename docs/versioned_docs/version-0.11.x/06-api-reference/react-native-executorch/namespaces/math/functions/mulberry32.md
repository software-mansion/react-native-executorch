# Function: mulberry32()

> **mulberry32**(`seed`): () => `number`

Defined in: [extensions/math.ts:138](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/math.ts#L138)

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
