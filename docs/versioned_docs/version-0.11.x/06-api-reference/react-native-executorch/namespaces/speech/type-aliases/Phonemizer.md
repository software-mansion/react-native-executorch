# Type Alias: Phonemizer

> **Phonemizer** = `object`

Defined in: [extensions/speech/utils/phonemizer.ts:76](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L76)

Native Grapheme-to-Phoneme (G2P) conversion interface.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [extensions/speech/utils/phonemizer.ts:101](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L101)

Releases the allocated native phonemizer resources. The instance must not
be used afterwards.

#### Returns

`void`

---

### phonemize()

#### Call Signature

> **phonemize**(`text`): `string`

Defined in: [extensions/speech/utils/phonemizer.ts:84](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L84)

Converts input text into phonetic IPA transcription.

##### Parameters

###### text

`string`

Input text string to be phonemized.

##### Returns

`string`

Phonetic transcription string.

##### Throws

With code `RESOURCE_BUSY` if the phonemizer is
in use, or `RESOURCE_DISPOSED` if disposed.

#### Call Signature

> **phonemize**(`text`, `options`): [`PhonemizedText`](PhonemizedText.md)

Defined in: [extensions/speech/utils/phonemizer.ts:95](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/phonemizer.ts#L95)

Converts input text into phonetic IPA transcription and locates each of its
words in it.

##### Parameters

###### text

`string`

Input text string to be phonemized.

###### options

Pass `{ words: true }` to locate the words.

###### words

`true`

##### Returns

[`PhonemizedText`](PhonemizedText.md)

The phonemes and the words located in them. See [PhonemizedText](PhonemizedText.md).

##### Throws

With code `RESOURCE_BUSY` if the phonemizer is
in use, or `RESOURCE_DISPOSED` if disposed.
