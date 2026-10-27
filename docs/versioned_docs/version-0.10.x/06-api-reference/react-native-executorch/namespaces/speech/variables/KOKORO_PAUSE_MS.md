# Variable: KOKORO_PAUSE_MS

> `const` **KOKORO_PAUSE_MS**: `Record`\<`string`, `number`\>

Defined in: [extensions/speech/utils/kokoroUtils.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L44)

Silence (in milliseconds) appended after a chunk ending with a given phoneme,
so pauses between subsentences sound natural. Phonemes absent from the map
get no pause.
