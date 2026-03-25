# Interface: TextToSpeechType

Defined in: [types/tts.ts:110](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L110)

Return type for the `useTextToSpeech` hook.
Manages the state and operations for Text-to-Speech generation.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/tts.ts:129](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L129)

Represents the download progress of the model and voice assets as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/tts.ts:114](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L114)

Contains the error object if the model failed to load or encountered an error during inference.

***

### forward()

> **forward**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/tts.ts:137](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L137)

Runs the model to convert the provided text into speech audio in a single pass.

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

### forwardFromPhonemes()

> **forwardFromPhonemes**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/tts.ts:146](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L146)

Synthesizes pre-computed phonemes into speech audio in a single pass.
Bypasses the built-in phonemizer, allowing use of external G2P systems.

#### Parameters

##### input

[`TextToSpeechPhonemeInput`](TextToSpeechPhonemeInput.md)

The `TextToSpeechPhonemeInput` object containing pre-computed `phonemes` and optional `speed`.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Promise that resolves with the generated audio data.

#### Throws

If the model is not loaded or is currently generating.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/tts.ts:124](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L124)

Indicates whether the model is currently generating audio.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/tts.ts:119](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L119)

Indicates whether the Text-to-Speech model is loaded and ready to accept inputs.

***

### stream()

> **stream**: (`input`) => `Promise`\<`void`\>

Defined in: [types/tts.ts:157](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L157)

Streams the generated audio data incrementally.
This is optimal for real-time playback, allowing audio to start playing before the full text is synthesized.

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

### streamFromPhonemes()

> **streamFromPhonemes**: (`input`) => `Promise`\<`void`\>

Defined in: [types/tts.ts:165](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L165)

Streams pre-computed phonemes incrementally, bypassing the built-in phonemizer.

#### Parameters

##### input

[`TextToSpeechStreamingPhonemeInput`](TextToSpeechStreamingPhonemeInput.md)

The streaming input with pre-computed `phonemes` instead of `text`.

#### Returns

`Promise`\<`void`\>

A Promise that resolves when the streaming process is complete.

#### Throws

If the model is not loaded or is currently generating.

***

### streamInsert()

> **streamInsert**: (`textChunk`) => `void`

Defined in: [types/tts.ts:172](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L172)

Inserts new text chunk into the buffer to be processed in streaming mode.

#### Parameters

##### textChunk

`string`

#### Returns

`void`

***

### streamStop()

> **streamStop**: (`instant?`) => `void`

Defined in: [types/tts.ts:179](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tts.ts#L179)

Interrupts and stops the currently active audio generation stream.

#### Parameters

##### instant?

`boolean`

If true, stops the streaming as soon as possible. Otherwise
               allows the module to complete processing for the remains of the buffer.

#### Returns

`void`
