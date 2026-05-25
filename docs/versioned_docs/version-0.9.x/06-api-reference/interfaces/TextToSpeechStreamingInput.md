# Interface: TextToSpeechStreamingInput

Defined in: [types/tts.ts:176](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L176)

Text to Speech streaming input definition

Streaming mode in T2S is synchronized by passing specific callbacks
executed at given moments of the streaming.
Actions such as playing the audio should happen within the onNext callback.
Callbacks can be both synchronous or asynchronous.

Enables an incrementally expanded input, in other words adding
new text chunks with streamInsert() as the streaming is running.

## Extends

- [`TextToSpeechInput`](TextToSpeechInput.md).[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md)

## Properties

### onBegin()?

> `optional` **onBegin**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:158](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L158)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onBegin`](TextToSpeechStreamingCallbacks.md#onbegin)

---

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:160](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L160)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onEnd`](TextToSpeechStreamingCallbacks.md#onend)

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

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onNext`](TextToSpeechStreamingCallbacks.md#onnext)

---

### phonemize?

> `optional` **phonemize**: `boolean`

Defined in: [types/tts.ts:91](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L91)

if true (default), the input is treated as text and converted to phonemes.
If false, the input should already be in IPA phonemes.

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`phonemize`](TextToSpeechInput.md#phonemize)

---

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:90](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L90)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

---

### stopAutomatically?

> `optional` **stopAutomatically**: `boolean`

Defined in: [types/tts.ts:178](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L178)

If true, streaming will stop automatically when the buffer is empty.

---

### text?

> `optional` **text**: `string`

Defined in: [types/tts.ts:89](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/tts.ts#L89)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
