# Interface: TextToSpeechStreamingInput

Defined in: [types/tts.ts:146](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L146)

Text to Speech streaming input definition

Streaming mode in T2S is synchronized by passing specific callbacks
executed at given moments of the streaming.
Actions such as playing the audio should happen within the onNext callback.
Callbacks can be both synchronous or asynchronous.

## Extends

- [`TextToSpeechInput`](TextToSpeechInput.md)

## Properties

### onBegin()?

> `optional` **onBegin**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:147](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L147)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

---

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:149](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L149)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

---

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:148](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L148)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>

---

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:82](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L82)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

---

### text

> **text**: `string`

Defined in: [types/tts.ts:81](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L81)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
