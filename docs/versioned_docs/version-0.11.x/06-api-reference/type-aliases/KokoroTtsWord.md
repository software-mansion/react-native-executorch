# Type Alias: KokoroTtsWord

> **KokoroTtsWord** = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:112](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L112)

A word of the input text, with the time it is spoken at.

## Properties

### end

> `readonly` **end**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:120](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L120)

Time the word ends, in seconds since the beginning of the first chunk.

---

### offset

> `readonly` **offset**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:116](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L116)

UTF-16 offset of the word in the input text.

---

### start

> `readonly` **start**: `number`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:118](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L118)

Time the word starts, in seconds since the beginning of the first chunk.

---

### text

> `readonly` **text**: `string`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:114](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L114)

The word as it appears in the input text.
