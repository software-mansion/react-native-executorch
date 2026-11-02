# Ready-made models and tasks

The catalog is a useful first choice when its tasks and quality fit the user's goal. It is not the
boundary of the library: for a different model or task, read `custom-models.md`.

## Model selection

Use the installed version's `models` registry and Supported Models page. `.DEFAULT` is a model config
object choosing a platform-appropriate backend among that model's published variants. It is not a
function. Explicit backend variants must actually exist and be enabled in the app.

Representative 0.11.x entry points:

| Goal                  | Hook and model configuration                                             |
| --------------------- | ------------------------------------------------------------------------ |
| Streaming chat        | `useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT)`                      |
| OCR                   | `useOpticalCharacterRecognizer(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT)` |
| Classification        | `useClassifier(models.classification.EFFICIENTNET_V2_S.DEFAULT)`         |
| Text embeddings       | `useTextEmbedder(models.textEmbeddings.ALL_MINILM_L6_V2.DEFAULT)`        |
| Whisper transcription | `useSpeechToText(models.speechToText.WHISPER.EN.TINY.DEFAULT)`           |

The catalog also includes object/keypoint detection, segmentation, depth, image embeddings, style
transfer, inpainting, text-to-image, text-to-speech, VAD, privacy filtering and late-interaction retrieval.
Choose exact registry keys from the matching documentation. Check per-device latency/memory benchmarks,
model license, languages, modalities, output semantics and required assets before choosing a model.

## Streaming chat

This component targets 0.11.x and uses the session API. The stop button interrupts the active turn;
the send handler waits for completion before allowing another one. The hook owns resource cleanup.

```tsx
import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { models, useLLMChatSession } from 'react-native-executorch';

export function LocalChat() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const session = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT);

  const send = async () => {
    if (!session.isReady || !session.sendMessage || busy) return;
    setBusy(true);
    setText('');
    setGenerationError('');
    try {
      await session.sendMessage('Explain on-device AI in one sentence.', (token) => {
        setText((previous) => previous + token);
      });
    } catch (error) {
      setGenerationError(String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Text>{session.error?.message ?? generationError}</Text>
      <Text>{text}</Text>
      <Button title="Send" disabled={!session.isReady || busy} onPress={send} />
      <Button title="Stop" disabled={!busy} onPress={() => session.stop?.()} />
    </View>
  );
}
```

For imperative chat, download the whole model config, pass it to `createLLMChatSession`, and dispose
after the active turn settles. Inspect `LLMChatSessionOptions` for initial history, generation options,
tool callbacks and multimodal support; these are model-dependent, not implied by every LLM config.

## Domain input contracts

- **Vision:** tasks generally take a raw `ImageBuffer` from `react-native-executorch/cv`:
  `{ data: Uint8Array, width, height, format: 'rgb', layout: 'hwc' }`. JPEG/PNG file bytes are compressed
  images, not raw pixels. Decode/orient the image first; pass camera frames through the documented
  camera/resizer integration instead of serializing frame handles into generic JS data.
- **Speech:** Whisper takes decoded mono PCM `Float32Array` at the documented sample rate, with the
  required transcription options. A file path, WAV container or encoded microphone blob is not PCM.
  Inspect `transcribe`, `streamInsert`, `streamStop` and sample-rate constants for the chosen pipeline.
- **Embeddings:** `embed(text)` returns a `Float32Array`. Keep query and document vectors in the same
  model/vector space and follow its pooling, normalization and prompt conventions. The in-memory
  vector store is not durable persistence.

If the built-in task's schema or preprocessing does not fit a custom model, reconcile the contract or
build a custom task. Do not suppress validation or feed arbitrary weights to a convenient hook.

- [Supported Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/supported-models)
- [LLM Chat](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation)
- [API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference)
