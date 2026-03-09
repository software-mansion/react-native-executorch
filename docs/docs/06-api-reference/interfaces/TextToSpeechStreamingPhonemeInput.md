# Interface: TextToSpeechStreamingPhonemeInput

Defined in: [types/tts.ts:214](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L214)

Streaming input definition for pre-computed phonemes.
Same as `TextToSpeechStreamingInput` but accepts `phonemes` instead of `text`.

## Extends

- [`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md).[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md)

## Properties

### onBegin()?

> `optional` **onBegin**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:190](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L190)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onBegin`](TextToSpeechStreamingCallbacks.md#onbegin)

---

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:192](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L192)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onEnd`](TextToSpeechStreamingCallbacks.md#onend)

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

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onNext`](TextToSpeechStreamingCallbacks.md#onnext)

---

### phonemes

> **phonemes**: `string`

Defined in: [types/tts.ts:104](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L104)

pre-computed IPA phoneme string

#### Inherited from

[`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md).[`phonemes`](TextToSpeechPhonemeInput.md#phonemes)

---

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:105](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L105)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md).[`speed`](TextToSpeechPhonemeInput.md#speed)
