# Interface: KokoroOptions

Defined in: [packages/react-native-executorch/src/types/tts.ts:48](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L48)

Extra options associated with the Kokoro model

## Properties

### fixedModel?

> `optional` **fixedModel**: `"small"` \| `"medium"` \| `"large"`

Defined in: [packages/react-native-executorch/src/types/tts.ts:49](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L49)

if set, forces Kokoro to use only one if it's 3 models
                                with static input shapes. Reduces the memory usage and
                                inference time variance, but could affect the result quality a little bit.
