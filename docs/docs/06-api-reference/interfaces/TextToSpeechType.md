# Interface: TextToSpeechType

Defined in: [packages/react-native-executorch/src/types/tts.ts:87](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L87)

Return type for the `useTextToSpeech` hook.
Manages the state and operations for Text-to-Speech generation.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/tts.ts:106](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L106)

Represents the download progress of the model and voice assets as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/tts.ts:91](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L91)

Contains the error object if the model failed to load or encountered an error during inference.

***

### forward()

> **forward**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:114](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L114)

Runs the model to convert the provided text into speech audio in a single pass.
*

#### Parameters

##### input

[`TextToSpeechInput`](TextToSpeechInput.md)

The `TextToSpeechInput` object containing the `text` to synthesize and optional `speed`.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Promise that resolves with the generated audio data (typically a `Float32Array`).

#### Throws

If the model is not loaded or is currently generating.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tts.ts:101](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L101)

Indicates whether the model is currently generating audio.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tts.ts:96](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L96)

Indicates whether the Text-to-Speech model is loaded and ready to accept inputs.

***

### stream()

> **stream**: (`input`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:123](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L123)

Streams the generated audio data incrementally. 
This is optimal for real-time playback, allowing audio to start playing before the full text is synthesized.
*

#### Parameters

##### input

[`TextToSpeechStreamingInput`](TextToSpeechStreamingInput.md)

The `TextToSpeechStreamingInput` object containing `text`, optional `speed`, and lifecycle callbacks (`onBegin`, `onNext`, `onEnd`).

#### Returns

`Promise`\<`void`\>

A Promise that resolves when the streaming process is complete.

#### Throws

If the model is not loaded or is currently generating.

***

### streamStop()

> **streamStop**: () => `void`

Defined in: [packages/react-native-executorch/src/types/tts.ts:128](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/tts.ts#L128)

Interrupts and stops the currently active audio generation stream.

#### Returns

`void`
