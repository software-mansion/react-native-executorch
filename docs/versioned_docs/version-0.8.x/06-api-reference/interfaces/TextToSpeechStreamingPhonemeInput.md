# Interface: TextToSpeechStreamingPhonemeInput

Defined in: [types/tts.ts:218](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L218)

Streaming input definition for pre-computed phonemes.
Same as `TextToSpeechStreamingInput` but accepts `phonemes` instead of `text`.

## Extends

- [`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md).[`TextToSpeechStreamingCallbacks`](TextToSpeechStreamingCallbacks.md)

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

### phonemes

> **phonemes**: `string`

Defined in: [types/tts.ts:101](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L101)

pre-computed IPA phoneme string

#### Inherited from

[`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md).[`phonemes`](TextToSpeechPhonemeInput.md#phonemes)

***

### speed?

> `optional` **speed**: `number`

Defined in: [types/tts.ts:102](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L102)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md).[`speed`](TextToSpeechPhonemeInput.md#speed)
