# Interface: VADStreamingInput

Defined in: [types/vad.ts:63](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L63)

Input configuration for the VAD streaming hook.

## Properties

### onSpeechBegin()?

> `optional` **onSpeechBegin**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/vad.ts:64](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L64)

Callback function triggered when speech is detected.

#### Returns

`void` \| `Promise`\<`void`\>

---

### onSpeechEnd()?

> `optional` **onSpeechEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/vad.ts:65](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L65)

Callback function triggered when speech end (silence is detected).

#### Returns

`void` \| `Promise`\<`void`\>

---

### options?

> `optional` **options**: [`VADStreamingOptions`](VADStreamingOptions.md)

Defined in: [types/vad.ts:66](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L66)

Optional configuration for the streaming process.
