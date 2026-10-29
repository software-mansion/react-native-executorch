# Interface: TextToSpeechStreamingCallbacks

Defined in: [types/tts.ts:157](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L157)

Shared streaming lifecycle callbacks for TTS streaming modes.

## Extended by

- [`TextToSpeechStreamingInput`](TextToSpeechStreamingInput.md)

## Properties

### onBegin()?

> `optional` **onBegin**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:158](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L158)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

---

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:160](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L160)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

---

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:159](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L159)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>
