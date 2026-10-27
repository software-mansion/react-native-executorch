# Function: parseVoice()

> **parseVoice**(`base64`): `Float32Array`

Defined in: [extensions/speech/utils/kokoroUtils.ts:66](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L66)

Parses a base64-encoded Kokoro voice file into its raw float rows. Each row
holds a [KOKORO_VOICE_REF_SIZE](../variables/KOKORO_VOICE_REF_SIZE.md)-long reference vector for one input
token count.

## Parameters

### base64

`string`

The base64 contents of the voice `.bin` file.

## Returns

`Float32Array`

The flattened voice matrix, row-major.
