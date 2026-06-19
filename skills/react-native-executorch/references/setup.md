# Setup, Model Loading & Utilities

Installation, initialization, model loading strategies, error handling, custom `.pte` models, tokenization, and PII redaction.

For the full getting-started guide, webfetch [Getting Started](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started). For version compatibility, webfetch [Compatibility](https://docs.swmansion.com/react-native-executorch/docs/other/compatibility).

---

## Installation

```bash
npm install react-native-executorch

# Expo projects
npm install react-native-executorch-expo-resource-fetcher

# Bare React Native projects
npm install react-native-executorch-bare-resource-fetcher
```

### Prerequisites

- **New Architecture (Fabric) required.** Old architecture is unsupported.
- **Expo Go is not supported.** Use a custom dev build (`npx expo prebuild`).
- **iOS release builds require a real device.** The simulator lacks Metal APIs ExecuTorch relies on.

---

## Initialization

Register a resource-fetcher adapter at app entry **before any other API**:

```tsx
// Expo
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });
```

```tsx
// Bare React Native
import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from 'react-native-executorch-bare-resource-fetcher';

initExecutorch({ resourceFetcher: BareResourceFetcher });
```

Calling any hook or module before `initExecutorch` throws `ResourceFetcherAdapterNotInitialized`.

If neither adapter fits (custom CDN, private auth, custom caching), implement the `ResourceFetcherAdapter` interface yourself — webfetch [Custom Adapter](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/custom-adapter).

For teardown (e.g. in tests), call `cleanupExecutorch()`.

---

## Metro config (bundled `.pte` models)

To `require('../assets/model.pte')`, register the extensions:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('pte');
config.resolver.assetExts.push('bin');

module.exports = config;
```

---

## Model loading strategies

Every hook accepts a `model` prop. Pick the strategy by model size and UX requirements.

```
How large is the model?
├── A published Software Mansion model?
│   └── Use the `models` registry accessor (recommended)
│       useLLM({ model: models.llm.llama3_2_1b() })
│
├── Small (< 512 MB) and must work offline from launch?
│   └── Bundle as an asset
│       useLLM({ model: { modelSource: require('../assets/model.pte'), … } })
│
├── Large (> 512 MB) or optional feature?
│   └── Remote URL (downloaded + cached on first use)
│       useLLM({ model: { modelSource: 'https://…/model.pte', … } })
│
└── User-managed / fine-tuned models?
    └── Local file path
        useLLM({ model: { modelSource: 'file:///var/mobile/…/model.pte', … } })
```

### `models` registry (recommended)

`models.<category>.<model>({ quant?, backend? })` — typed accessors that resolve to the right URL and backend per platform. Default is the quantized variant when one is published; iOS prefers CoreML, Android prefers XNNPACK, for multi-backend models.

```tsx
import {
  useLLM,
  useObjectDetection,
  useOCR,
  models,
} from 'react-native-executorch';

useLLM({ model: models.llm.llama3_2_3b() }); // platform default, quantized
useLLM({ model: models.llm.llama3_2_3b({ quant: false }) }); // full precision
useObjectDetection({
  model: models.object_detection.rf_detr_nano({ backend: 'xnnpack' }),
});
useOCR({ model: models.ocr.craft({ language: 'en' }) });
```

Available top-level categories: `llm`, `classification`, `object_detection`, `pose_estimation`, `semantic_segmentation`, `instance_segmentation`, `style_transfer`, `speech_to_text`, `text_to_speech`, `text_embedding`, `image_embedding`, `image_generation`, `vad`, `ocr`, `privacy_filter`. Per-category accessors are listed in [llm.md](./llm.md), [vision.md](./vision.md), [speech.md](./speech.md), and the privacy filter section below.

### `preventLoad`

Every hook accepts `preventLoad: true` to defer model download/load until you're ready:

```tsx
const llm = useLLM({ model: models.llm.llama3_2_1b(), preventLoad: true });
// Flip to false (or omit) to start loading
```

### Download progress

Hooks expose `downloadProgress` (0–1):

```tsx
const llm = useLLM({ model: models.llm.llama3_2_1b() });
<Text>{Math.round(llm.downloadProgress * 100)}%</Text>;
```

---

## Resource fetcher

For advanced download management — pause, resume, cancel, list, delete — the adapters expose a Promise-based API. For the full surface, webfetch [ResourceFetcher](https://docs.swmansion.com/react-native-executorch/docs/utilities/resource-fetcher).

```tsx
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

// Download with progress
const uris = await ExpoResourceFetcher.fetch(
  (p) => console.log(`${Math.round(p * 100)}%`),
  'https://example.com/model.pte',
  'https://example.com/tokenizer.bin'
);
// uris: string[] of local file paths (no `file://` prefix), or null if interrupted
```

```ts
await ExpoResourceFetcher.pauseFetching('https://…/model.pte');
const uris = await ExpoResourceFetcher.resumeFetching('https://…/model.pte');
await ExpoResourceFetcher.cancelFetching('https://…/model.pte');

const files = await ExpoResourceFetcher.listDownloadedFiles();
const models = await ExpoResourceFetcher.listDownloadedModels();
const bytes = await ExpoResourceFetcher.getFilesTotalSize(
  'https://…/model.pte'
);
await ExpoResourceFetcher.deleteResources('https://…/model.pte');
```

`BareResourceFetcher` exposes the same API but does **not** support pause/resume on Android — use Expo's if you need it cross-platform.

Downloaded files are stored in the app's documents directory.

---

## Error handling

All errors inherit from `RnExecutorchError` with a `code` from `RnExecutorchErrorCode`. For the full table, webfetch [Error Handling](https://docs.swmansion.com/react-native-executorch/docs/utilities/error-handling).

| Error code                             | When                                                       | Recovery                                                |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| `ResourceFetcherAdapterNotInitialized` | Any API used before `initExecutorch()`                     | Call `initExecutorch({ resourceFetcher })` at app entry |
| `ModuleNotLoaded`                      | Inference before `isReady === true`                        | Gate on `isReady`                                       |
| `ModelGenerating`                      | New inference while one is running                         | Wait or call `interrupt()`                              |
| `InvalidConfig`                        | Bad params (e.g. `topp > 1`)                               | Validate config                                         |
| `ResourceFetcherDownloadFailed`        | Network error during download                              | Retry with backoff                                      |
| `MemoryAllocationFailed`               | Model too large for device                                 | Switch to a smaller / quantized accessor                |
| `DownloadInterrupted`                  | Download did not complete                                  | Retry                                                   |
| `StreamingNotStarted`                  | `streamInsert` before `stream()` is active                 | Start `stream()` first                                  |
| `StreamingInProgress`                  | `stream()` while one is active                             | Wait or call `streamStop()`                             |
| `InvalidUserInput`                     | Empty / malformed input                                    | Validate before calling                                 |
| `FileReadFailed`                       | Bad image path, unsupported format                         | Verify path and format                                  |
| `LanguageNotSupported`                 | OCR / multilingual model asked for an unpublished language | Use a supported code                                    |

### Pattern

```tsx
import {
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';

try {
  await model.forward(imageUri);
} catch (err) {
  if (err instanceof RnExecutorchError) {
    switch (err.code) {
      case RnExecutorchErrorCode.ModuleNotLoaded:
        // Model still loading — show loading state
        break;
      case RnExecutorchErrorCode.ModelGenerating:
        // Already busy — wait or interrupt
        break;
      case RnExecutorchErrorCode.MemoryAllocationFailed:
        // Device can't fit the model — fall back to a smaller one
        break;
      default:
        console.error('ExecuTorch error:', err.code, err.message);
    }
  } else {
    throw err;
  }
}
```

---

## Custom models — `useExecutorch`

For `.pte` models not covered by a dedicated hook, use `useExecutorch` to run arbitrary tensor I/O.

### Exporting

1. Export your PyTorch model to `.pte` using the [ExecuTorch export tutorial](https://pytorch.org/executorch/stable/tutorials/export-to-executorch-tutorial.html).
2. Pick a backend: XNNPACK (CPU, cross-platform) or Core ML (iOS, uses ANE).
3. Load it via asset, URL, or local path.

### Running

```tsx
import { useExecutorch, ScalarType } from 'react-native-executorch';

const m = useExecutorch({
  modelSource: require('../assets/custom_model.pte'),
});

const run = async () => {
  const input = {
    dataPtr: new Float32Array([1.0, 2.0, 3.0]),
    sizes: [1, 3],
    scalarType: ScalarType.FLOAT,
  };

  const output = await m.forward([input]);
  // output: TensorPtr[] — output[0].dataPtr is an ArrayBuffer; interpret per scalarType
};
```

`TensorPtr`: `{ dataPtr: ArrayBuffer | TypedArray, sizes: number[], scalarType: ScalarType }`.

You own preprocessing (resize, normalize, color conversion) and postprocessing. Shapes must match your exported model exactly.

### Non-hook usage

For services or non-React contexts, use the module class directly via `fromModelName`:

```ts
import { ClassificationModule, models } from 'react-native-executorch';

const m = await ClassificationModule.fromModelName(
  models.classification.efficientnet_v2_s()
);
```

Every hook has a corresponding module: `LLMModule`, `ObjectDetectionModule`, `OCRModule`, `SpeechToTextModule`, `TextToSpeechModule`, etc.

---

## Tokenization — `useTokenizer`

HuggingFace-compatible BPE / WordPiece tokenizer. Mostly useful for counting tokens before sending text to embedding models or LLMs.

```tsx
import { useTokenizer, models } from 'react-native-executorch';

const tokenizer = useTokenizer({
  tokenizer: models.text_embedding.all_minilm_l6_v2(),
});

const ids = await tokenizer.encode('Hello, world!');
const text = await tokenizer.decode(ids);

const vocab = await tokenizer.getVocabSize();
const id = await tokenizer.tokenToId('hello');
const token = await tokenizer.idToToken(id);
```

You usually don't need this — `useLLM` and `useTextEmbeddings` tokenize internally.

---

## Privacy filter — `usePrivacyFilter`

On-device PII detection. Returns `PiiEntity[]` with `{ label, text, startToken, endToken }`. Useful for redacting messages before they leave the device.

```tsx
import { usePrivacyFilter, models } from 'react-native-executorch';

const pf = usePrivacyFilter({ model: models.privacy_filter.openai() });

const entities = await pf.generate(
  'Email me at jane@example.com — my account is 1234-5678-0001.'
);
// entities: [
//   { label: 'private_email', text: 'jane@example.com', startToken: …, endToken: … },
//   { label: 'account_number', text: '1234-5678-0001', startToken: …, endToken: … },
// ]
```

**Available accessors:**

- `models.privacy_filter.openai` — 8 entity types (account_number, private_address, private_date, private_email, private_person, private_phone, private_url, secret). Label list: `PRIVACY_FILTER_OPENAI_LABELS`.
- `models.privacy_filter.nemotron` — 55 entity types. Label list: `PRIVACY_FILTER_NEMOTRON_LABELS`.

Long inputs are processed in 50%-overlapping sliding windows automatically — no manual chunking required. The window size is set by the exported model's input shape.

For a custom fine-tune, pass a `PrivacyFilterModelSources` object directly (with your own `modelSource`, `tokenizerSource`, and `labelNames`). Optional `viterbiBiases` shift the precision/recall tradeoff.

---

## RAG with `react-native-rag`

For retrieval-augmented generation — vector stores, persistence, document ingestion, and a `useRAG` hook — use the sibling library [react-native-rag](https://github.com/software-mansion-labs/react-native-rag). It plugs straight into the `models` registry through `ExecuTorchEmbeddings` and `ExecuTorchLLM` wrappers, so you keep one model-selection convention across both libraries.

```bash
npm install react-native-rag
# Optional SQLite-backed persistence (otherwise an in-memory store is used)
npm install @react-native-rag/op-sqlite
```

```tsx
import {
  useRAG,
  MemoryVectorStore,
  ExecuTorchEmbeddings,
  ExecuTorchLLM,
} from 'react-native-rag';
import { models } from 'react-native-executorch';

const vectorStore = new MemoryVectorStore({
  embeddings: new ExecuTorchEmbeddings(
    models.text_embedding.all_minilm_l6_v2()
  ),
});

const llm = new ExecuTorchLLM(models.llm.lfm2_5_1_2b_instruct());

export default function App() {
  const rag = useRAG({ vectorStore, llm });

  // rag.addDocument(text), rag.query(question) → rag.response (streamed)
  return <Text>{rag.response}</Text>;
}
```

**When to reach for `react-native-rag` vs. rolling your own:**

- **Use the library** when you need document ingestion + chunking + retrieval + generation as one pipeline, persistent vector storage across launches, or want a hook-based API symmetric with `useLLM` / `useTextEmbeddings`.
- **Roll your own** (just `useTextEmbeddings` + cosine similarity + `useLLM`) when the corpus is small and ephemeral, or you need custom retrieval logic the library doesn't expose. The `useTextEmbeddings` example in [vision.md](./vision.md) shows the minimal building blocks.

Both `ExecuTorchEmbeddings` and `ExecuTorchLLM` accept any model accessor from the registry — same `{ quant, backend }` options apply. Custom components (vector stores, splitters, embedders) implement the library's `Embeddings` / `LLM` / `VectorStore` / `TextSplitter` interfaces.

---

## Device constraints

| Tier      | Parameter range | Examples                                                                       |
| --------- | --------------- | ------------------------------------------------------------------------------ |
| Low-end   | 135M–500M       | `models.llm.smollm2_1_135m`, `models.llm.smollm2_1_360m`                       |
| Mid-range | 500M–1.7B       | `models.llm.qwen3_0_6b`, `models.llm.smollm2_1_1_7b`, `models.llm.llama3_2_1b` |
| High-end  | 1.7B–4B         | `models.llm.qwen3_4b`, `models.llm.phi_4_mini_4b`, `models.llm.llama3_2_3b`    |

For per-model memory and inference benchmarks: webfetch [Benchmarks](https://docs.swmansion.com/react-native-executorch/docs/benchmarks/inference-time).

**Guidelines:**

- Stay on the default (quantized) variant unless you've measured a need for full precision.
- Test on the lowest-spec device you plan to support.
- Provide a cloud fallback for devices that can't fit the model.
- Surface a cleanup UI via `ExpoResourceFetcher.deleteResources` — downloaded models can be huge.
- Always show loading states. Model download and inference are seconds-to-minutes operations.

---

## See also

- [Getting started](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started)
- [Loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models)
- [Resource fetcher](https://docs.swmansion.com/react-native-executorch/docs/utilities/resource-fetcher)
- [Error handling](https://docs.swmansion.com/react-native-executorch/docs/utilities/error-handling)
- [useExecutorch API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useExecutorch)
- [useTokenizer API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTokenizer)
- [usePrivacyFilter API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePrivacyFilter)
