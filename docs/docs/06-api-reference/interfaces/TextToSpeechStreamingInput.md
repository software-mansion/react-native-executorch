# Interface: TextToSpeechStreamingInput

Defined in: [packages/react-native-executorch/src/types/tts.ts:133](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tts.ts#L133)

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

Defined in: [packages/react-native-executorch/src/types/tts.ts:134](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tts.ts#L134)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

***

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:136](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tts.ts#L136)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

***

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:135](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tts.ts#L135)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>

***

### speed?

> `optional` **speed**: `number`

Defined in: [packages/react-native-executorch/src/types/tts.ts:71](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tts.ts#L71)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

***

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/tts.ts:70](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tts.ts#L70)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
