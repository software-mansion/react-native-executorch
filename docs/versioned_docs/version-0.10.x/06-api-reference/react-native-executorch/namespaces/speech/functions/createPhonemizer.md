# Function: createPhonemizer()

> **createPhonemizer**(`config`): [`Phonemizer`](../type-aliases/Phonemizer.md)

Defined in: [extensions/speech/utils/phonemizer.ts:67](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L67)

Creates a grapheme-to-phoneme (G2P) pipeline for the configured language.

## Parameters

### config

[`PhonemizerConfig`](../type-aliases/PhonemizerConfig.md)

Phonemizer configuration and asset paths.
See [PhonemizerConfig](../type-aliases/PhonemizerConfig.md).

## Returns

[`Phonemizer`](../type-aliases/Phonemizer.md)

The native [Phonemizer](../type-aliases/Phonemizer.md) instance.

## Throws

With code `INVALID_STATE` if the native build
lacks phonemizer support, or `LOAD_FAILED` if phonemizer assets fail to load.
