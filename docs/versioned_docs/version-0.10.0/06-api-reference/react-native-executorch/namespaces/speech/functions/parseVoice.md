# Function: parseVoice()

> **parseVoice**(`base64`): `Float32Array`

Defined in: [extensions/speech/utils/kokoroUtils.ts:66](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L66)

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
