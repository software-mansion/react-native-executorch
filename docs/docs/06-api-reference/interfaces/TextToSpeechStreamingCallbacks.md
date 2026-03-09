# Interface: TextToSpeechStreamingCallbacks

Defined in: [types/tts.ts:189](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L189)

Shared streaming lifecycle callbacks for TTS streaming modes.

## Extended by

- [`TextToSpeechStreamingInput`](TextToSpeechStreamingInput.md)
- [`TextToSpeechStreamingPhonemeInput`](TextToSpeechStreamingPhonemeInput.md)

## Properties

### onBegin()?

> `optional` **onBegin**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:190](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L190)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

---

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:192](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L192)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

---

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:191](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L191)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>
