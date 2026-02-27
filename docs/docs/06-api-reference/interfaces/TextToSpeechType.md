# Interface: TextToSpeechType

Defined in: [types/tts.ts:90](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L90)

Return type for the `useTextToSpeech` hook.
Manages the state and operations for Text-to-Speech generation.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/tts.ts:109](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L109)

Represents the download progress of the model and voice assets as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/tts.ts:94](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L94)

Contains the error object if the model failed to load or encountered an error during inference.

---

### forward()

> **forward**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/tts.ts:117](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L117)

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

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/tts.ts:104](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L104)

Indicates whether the model is currently generating audio.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/tts.ts:99](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L99)

Indicates whether the Text-to-Speech model is loaded and ready to accept inputs.

---

### stream()

> **stream**: (`input`) => `Promise`\<`void`\>

Defined in: [types/tts.ts:126](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L126)

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

---

### streamStop()

> **streamStop**: () => `void`

Defined in: [types/tts.ts:131](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tts.ts#L131)

Interrupts and stops the currently active audio generation stream.

#### Returns

`void`
