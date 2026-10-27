# Type Alias: Phonemizer

> **Phonemizer** = `object`

Defined in: [extensions/speech/utils/phonemizer.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L35)

Native Grapheme-to-Phoneme (G2P) conversion interface.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [extensions/speech/utils/phonemizer.ts:49](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L49)

Releases the allocated native phonemizer resources. The instance must not
be used afterwards.

#### Returns

`void`

---

### phonemize()

> **phonemize**(`text`): `string`

Defined in: [extensions/speech/utils/phonemizer.ts:43](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L43)

Converts input text into phonetic IPA transcription.

#### Parameters

##### text

`string`

Input text string to be phonemized.

#### Returns

`string`

Phonetic transcription string.

#### Throws

With code `RESOURCE_BUSY` if the phonemizer is
in use, or `RESOURCE_DISPOSED` if disposed.
