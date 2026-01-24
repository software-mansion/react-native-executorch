# Interface: TextToSpeechStreamingInput

Defined in: [packages/react-native-executorch/src/types/tts.ts:73](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/tts.ts#L73)

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

Defined in: [packages/react-native-executorch/src/types/tts.ts:74](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/tts.ts#L74)

Called when streaming begins

#### Returns

`void` \| `Promise`\<`void`\>

***

### onEnd()?

> `optional` **onEnd**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:76](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/tts.ts#L76)

Called when streaming ends

#### Returns

`void` \| `Promise`\<`void`\>

***

### onNext()?

> `optional` **onNext**: (`audio`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:75](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/tts.ts#L75)

Called after each audio chunk gets calculated.

#### Parameters

##### audio

`Float32Array`

#### Returns

`void` \| `Promise`\<`void`\>

***

### speed?

> `optional` **speed**: `number`

Defined in: [packages/react-native-executorch/src/types/tts.ts:59](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/tts.ts#L59)

optional speed argument - the higher it is, the faster the speech becomes

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`speed`](TextToSpeechInput.md#speed)

***

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/tts.ts:58](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/tts.ts#L58)

a text to be spoken

#### Inherited from

[`TextToSpeechInput`](TextToSpeechInput.md).[`text`](TextToSpeechInput.md#text)
