# Function: tokenize()

> **tokenize**(`phonemes`, `totalLength`, `phonemeIndices?`): `BigInt64Array`

Defined in: [extensions/speech/utils/kokoroUtils.ts:100](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L100)

Maps phonemes to vocabulary tokens, padded with the pad token on both ends.

## Parameters

### phonemes

`string`[]

The phoneme sequence, split into code points.

### totalLength

`number`

The exact token count to produce, including padding.

### phonemeIndices?

`Int32Array`\<`ArrayBufferLike`\>

Optional `totalLength`-long output receiving, for every
token, the index of the phoneme it encodes, or -1 for padding.

## Returns

`BigInt64Array`

Token ids ready to be written into an `int64` tensor.
