# Function: parseVoiceStyle()

> **parseVoiceStyle**(`json`): [`SupertonicVoiceStyle`](../type-aliases/SupertonicVoiceStyle.md)

Defined in: [extensions/speech/utils/supertonicUtils.ts:196](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L196)

Parses raw JSON voice style object data into Float32Arrays.

## Parameters

### json

`any`

The parsed JSON voice style object.

## Returns

[`SupertonicVoiceStyle`](../type-aliases/SupertonicVoiceStyle.md)

Parsed SupertonicVoiceStyle containing styleTtl and styleDp Float32Arrays.

## Throws

With code `LOAD_FAILED` if the voice style JSON
format is invalid or missing required tensor data.
