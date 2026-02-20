# Interface: TextToSpeechType

Defined in: [packages/react-native-executorch/src/types/tts.ts:99](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L99)

Return type for the `useTextToSpeech` hook.
Manages the state and operations for Text-to-Speech generation.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/tts.ts:118](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L118)

Represents the download progress of the model and voice assets as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/tts.ts:103](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L103)

Contains the error object if the model failed to load or encountered an error during inference.

---

### forward()

> **forward**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:126](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L126)

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

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tts.ts:113](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L113)

Indicates whether the model is currently generating audio.

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tts.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L108)

Indicates whether the Text-to-Speech model is loaded and ready to accept inputs.

---

### stream()

> **stream**: (`input`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/tts.ts:135](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L135)

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

### streamStop()

> **streamStop**: () => `void`

Defined in: [packages/react-native-executorch/src/types/tts.ts:140](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/tts.ts#L140)

Interrupts and stops the currently active audio generation stream.

#### Returns

`void`
