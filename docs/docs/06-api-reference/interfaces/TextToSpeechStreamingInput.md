# Interface: TextToSpeechStreamingInput

Defined in: [packages/react-native-executorch/src/types/tts.ts:87](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L87)

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

Defined in: [packages/react-native-executorch/src/types/tts.ts:88](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L88)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

***

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:90](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L90)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

***

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:89](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L89)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>

***

### speed?

> `optional` **speed**: `number`

Defined in: [packages/react-native-executorch/src/types/tts.ts:73](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L73)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

***

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/tts.ts:72](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/types/tts.ts#L72)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
