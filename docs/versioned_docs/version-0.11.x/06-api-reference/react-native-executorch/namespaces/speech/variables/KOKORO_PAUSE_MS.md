# Variable: KOKORO_PAUSE_MS

> `const` **KOKORO_PAUSE_MS**: `Record`\<`string`, `number`\>

Defined in: [extensions/speech/utils/kokoroUtils.ts:44](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L44)

Silence (in milliseconds) appended after a chunk ending with a given phoneme,
so pauses between subsentences sound natural. Phonemes absent from the map
get no pause.
