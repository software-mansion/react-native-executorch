# Type Alias: SupertonicVoiceStyle

> **SupertonicVoiceStyle** = `object`

Defined in: [extensions/speech/utils/supertonicUtils.ts:181](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L181)

Parsed voice style tensors required by Supertonic 3 for style conditioning.

## Properties

### styleDp

> `readonly` **styleDp**: `Float32Array`

Defined in: [extensions/speech/utils/supertonicUtils.ts:185](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L185)

Duration predictor style embedding tensor data of shape [1, 8, 16] (128 floats).

---

### styleTtl

> `readonly` **styleTtl**: `Float32Array`

Defined in: [extensions/speech/utils/supertonicUtils.ts:183](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L183)

Text-to-latent style embedding tensor data of shape [1, 50, 256] (12,800 floats).
