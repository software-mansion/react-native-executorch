# Function: createPhonemizer()

> **createPhonemizer**(`config`): [`Phonemizer`](../type-aliases/Phonemizer.md)

Defined in: [extensions/speech/utils/phonemizer.ts:119](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L119)

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
