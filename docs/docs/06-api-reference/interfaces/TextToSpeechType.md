# Interface: TextToSpeechType

Defined in: [types/tts.ts:114](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L114)

Return type for the `useTextToSpeech` hook.
Manages the state and operations for Text-to-Speech generation.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/tts.ts:133](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L133)

Represents the download progress of the model and voice assets as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/tts.ts:118](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L118)

Contains the error object if the model failed to load or encountered an error during inference.

---

### forward()

> **forward**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/tts.ts:141](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L141)

Runs the model to convert the provided text into speech audio in a single pass.

-

#### Parameters

##### input

[`TextToSpeechInput`](TextToSpeechInput.md)

The `TextToSpeechInput` object containing the `text` to synthesize and optional `speed`.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Promise that resolves with the generated audio data (typically a `Float32Array`).

#### Throws

If the model is not loaded or is currently generating.

---

### forwardFromPhonemes()

> **forwardFromPhonemes**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/tts.ts:151](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L151)

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

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/tts.ts:128](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L128)

Indicates whether the model is currently generating audio.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/tts.ts:123](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L123)

Indicates whether the Text-to-Speech model is loaded and ready to accept inputs.

---

### stream()

> **stream**: (`input`) => `Promise`\<`void`\>

Defined in: [types/tts.ts:162](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L162)

Streams the generated audio data incrementally.
This is optimal for real-time playback, allowing audio to start playing before the full text is synthesized.

-

#### Parameters

##### input

[`TextToSpeechStreamingInput`](TextToSpeechStreamingInput.md)

The `TextToSpeechStreamingInput` object containing `text`, optional `speed`, and lifecycle callbacks (`onBegin`, `onNext`, `onEnd`).

#### Returns

`Promise`\<`void`\>

A Promise that resolves when the streaming process is complete.

#### Throws

If the model is not loaded or is currently generating.

---

### streamFromPhonemes()

> **streamFromPhonemes**: (`input`) => `Promise`\<`void`\>

Defined in: [types/tts.ts:171](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L171)

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

---

### streamStop()

> **streamStop**: () => `void`

Defined in: [types/tts.ts:178](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L178)

Interrupts and stops the currently active audio generation stream.

#### Returns

`void`
