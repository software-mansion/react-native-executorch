# Interface: TextToSpeechStreamingInput

Defined in: [packages/react-native-executorch/src/types/tts.ts:156](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L156)

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

Defined in: [packages/react-native-executorch/src/types/tts.ts:157](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L157)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

---

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:159](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L159)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

---

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:158](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L158)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>

---

### speed?

> `optional` **speed**: `number`

Defined in: [packages/react-native-executorch/src/types/tts.ts:90](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L90)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

---

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/tts.ts:89](https://github.com/software-mansion/react-native-executorch/blob/dc92f1905151887815a38c7ea48c46a40970e531/packages/react-native-executorch/src/types/tts.ts#L89)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
