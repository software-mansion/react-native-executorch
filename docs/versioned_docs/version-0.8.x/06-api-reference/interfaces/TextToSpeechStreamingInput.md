# Interface: TextToSpeechStreamingInput

Defined in: [types/tts.ts:208](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L208)

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

Defined in: [types/tts.ts:190](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L190)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onBegin`](TextToSpeechStreamingCallbacks.md#onbegin)

***

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:192](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L192)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onEnd`](TextToSpeechStreamingCallbacks.md#onend)

***

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [types/tts.ts:191](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L191)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md).[`onNext`](TextToSpeechStreamingCallbacks.md#onnext)

***

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:88](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L88)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

***

### stopAutomatically?

> `optional` **stopAutomatically**: `boolean`

Defined in: [types/tts.ts:210](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L210)

If true, streaming will stop automatically when the buffer is empty.

***

### text?

> `optional` **text**: `string`

Defined in: [types/tts.ts:87](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L87)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
