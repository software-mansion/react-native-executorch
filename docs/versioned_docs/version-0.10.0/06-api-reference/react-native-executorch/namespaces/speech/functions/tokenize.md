# Function: tokenize()

> **tokenize**(`phonemes`, `totalLength`): `BigInt64Array`

Defined in: [extensions/speech/utils/kokoroUtils.ts:98](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L98)

Maps phonemes to vocabulary tokens, padded with the pad token on both ends.

## Parameters

### phonemes

`string`[]

The phoneme sequence, split into code points.

### totalLength

`number`

The exact token count to produce, including padding.

## Returns

`BigInt64Array`

Token ids ready to be written into an `int64` tensor.
