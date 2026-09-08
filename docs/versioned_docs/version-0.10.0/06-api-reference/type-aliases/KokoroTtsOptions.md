# Type Alias: KokoroTtsOptions\<K\>

> **KokoroTtsOptions**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:90](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L90)

Per-call execution options for Kokoro Text-to-Speech synthesis.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice keys record constraint.

## Properties

### maxChunkLength?

> `readonly` `optional` **maxChunkLength**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:98](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L98)

Maximum phoneme count per chunk. Defaults to the model's token limit.

---

### phonemize?

> `readonly` `optional` **phonemize**: `boolean`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:96](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L96)

If false, the input is treated as IPA phonemes and not phonemized.

---

### speed?

> `readonly` `optional` **speed**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:94](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L94)

Speech speed factor (range: 0.1 to 3.0).

---

### voice

> `readonly` **voice**: `K`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:92](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L92)

Voice name matching one of the keys in `config.voices`.
