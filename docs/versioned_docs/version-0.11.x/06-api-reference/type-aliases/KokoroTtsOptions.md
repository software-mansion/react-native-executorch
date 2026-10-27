# Type Alias: KokoroTtsOptions\<K\>

> **KokoroTtsOptions**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:97](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L97)

Per-call execution options for Kokoro Text-to-Speech synthesis.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice keys record constraint.

## Properties

### maxChunkLength?

> `readonly` `optional` **maxChunkLength**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:105](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L105)

Maximum phoneme count per chunk. Defaults to the model's token limit.

---

### phonemize?

> `readonly` `optional` **phonemize**: `boolean`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:103](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L103)

If false, the input is treated as IPA phonemes and not phonemized.

---

### speed?

> `readonly` `optional` **speed**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:101](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L101)

Speech speed factor (range: 0.1 to 3.0).

---

### voice

> `readonly` **voice**: `K`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:99](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L99)

Voice name matching one of the keys in `config.voices`.
