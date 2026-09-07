# Operations & Utilities

Building a pipeline is mostly the work around the model: turning an image or audio clip into the tensor a model expects, decoding tokens, and turning raw outputs into a usable result. React Native ExecuTorch ships the building blocks for this across five domain namespaces, so you compose these steps in TypeScript instead of writing native code — the same building blocks every built-in pipeline uses.

| Namespace                                                                                                                   | Provides                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`math`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math)     | Activations and reductions over tensors, plus numeric helpers. |
| [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv)         | Image transforms and bounding-box / geometry utilities.        |
| [`speech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech) | Audio framing and speech preprocessing.                        |
| [`nlp`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp)       | Tokenizers and privacy-filter utilities.                       |
| [`llm`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm)       | The LLM runner, chat preprocessing, and tool-calling.          |

```typescript
// Import as namespaces from the root entrypoint:
import { math, cv, speech, nlp, llm } from 'react-native-executorch';

// Or import directly from domain subpaths for types and standalone utilities:
import type { ImageBuffer, BoundingBox } from 'react-native-executorch/cv';
import type { ChatMessage, ToolDefinition } from 'react-native-executorch/llm';

```

All domain utilities and types are available both as namespaces on the root `react-native-executorch` import and directly via dedicated subpath imports (`react-native-executorch/cv`, `/llm`, `/nlp`, `/speech`, `/math`, `/schema`).

## Two kinds of building block[​](#two-kinds-of-building-block "Direct link to Two kinds of building block")

Everything here is one of two things, and the distinction matters for how you use it.

**Native tensor operations** run as compiled C++ kernels over [`Tensor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor) buffers. They follow the `fn(src, dst, ...options)` convention introduced in [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md#the-memory-model): you pre-allocate the destination tensor, the kernel writes into it in native memory and returns it, and you chain them with [`through`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md#chaining-transformations-with-through). Every one carries the `'worklet'` directive, so they run inside worklet runtimes. The `math`, `cv`, and `speech` operations below are all of this kind.

**TypeScript utilities** are ordinary functions — seeded random number generation, bounding-box geometry, tokenizers, the LLM runner. They work on plain numbers, typed arrays, and strings rather than tensor destinations, and they allocate and return their own result. The `nlp` and `llm` namespaces are entirely utilities, and `math` and `cv` include a few alongside their native operations.

## Math operations[​](#math-operations "Direct link to Math operations")

The [`math`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math) namespace covers the activations and reductions you reach for in postprocessing. All are native tensor operations over `float32`, except where a dtype is noted.

| Operation                                                                                                                                        | Signature                          | Purpose                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------ |
| [`sigmoid`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/sigmoid)     | `sigmoid(src, dst)`                | Element-wise sigmoid activation.                 |
| [`softmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/softmax)     | `softmax(src, dst, axis?)`         | Softmax along `axis` (default `-1`).             |
| [`argmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/argmax)       | `argmax(src, dst, axis?)`          | Index of the max along `axis`; `dst` is `int32`. |
| [`gather`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/gather)       | `gather(src, indices, dst, axis?)` | Reads `src` values at `int32` `indices`.         |
| [`threshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/threshold) | `threshold(src, dst, value)`       | Step function: `1.0` where `src >= value`.       |

[`argmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/argmax) and [`gather`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/gather) are designed to pair: `argmax` produces the indices whose shape `gather` expects, so together they extract the top class and its score from a batch of logits.

```typescript
import { tensor, math } from 'react-native-executorch';

const tLogits = tensor('float32', [1, 1000]); // filled by a classifier
const tIndex = tensor('int32', [1, 1]); // argmax → index
const tScore = tensor('float32', [1, 1]); // gather → value at that index

math.argmax(tLogits, tIndex);
math.gather(tLogits, tIndex, tScore);

```

## Computer vision operations[​](#computer-vision-operations "Direct link to Computer vision operations")

The [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv) namespace provides the image transforms that bridge a decoded image and a model's input tensor. Note the layout each one expects: [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/resize) and [`cvtColor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/cvtColor) work on channels-last `[H, W, C]` images, while [`normalize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/normalize) works on channels-first `[C, H, W]`.

| Operation                                                                                                                                                  | Signature                           | Purpose                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------- |
| [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/resize)                   | `resize(src, dst, options?)`        | Resize an `[H, W, C]` image.             |
| [`cvtColor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/cvtColor)               | `cvtColor(src, dst, code)`          | Convert color space (e.g. `'RGBA2RGB'`). |
| [`toChannelsFirst`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/toChannelsFirst) | `toChannelsFirst(src, dst)`         | `[H, W, C]` → `[C, H, W]`.               |
| [`toChannelsLast`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/toChannelsLast)   | `toChannelsLast(src, dst)`          | `[C, H, W]` → `[H, W, C]`.               |
| [`normalize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/normalize)             | `normalize(src, dst, options?)`     | Scale as `pixel * alpha + beta`.         |
| [`applyColormap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/applyColormap)     | `applyColormap(src, dst, colormap)` | Map single-channel values to colors.     |

Because each returns its destination, a full preprocessing pass reads as one [`through`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md#chaining-transformations-with-through) chain:

```typescript
import { cv } from 'react-native-executorch';

// tImage: uint8 [H, W, 4] → tChw: float32 [3, H', W'] ready for a model.
// toChannelsFirst preserves dtype, so it writes a uint8 CHW scratch (tChwU8);
// normalize then casts uint8 → float32 into a distinct destination (tChw).
tImage
  .through(cv.cvtColor, tRgb, 'RGBA2RGB')
  .through(cv.resize, tResized, { mode: 'stretch' })
  .through(cv.toChannelsFirst, tChwU8)
  .through(cv.normalize, tChw, { alpha: 1 / 255 });

```

### Geometry and detection helpers[​](#geometry-and-detection-helpers "Direct link to Geometry and detection helpers")

Alongside the image transforms, `cv` includes helpers for working with detector outputs and shapes. Some operate on tensors — [`nms`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/nms) (non-maximum suppression over boxes and scores) and [`restrictToBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/restrictToBox) — while the bounding-box, point, and quadrilateral utilities ([`decodeBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/decodeBox), [`scaleBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/scaleBox), [`orderQuad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/orderQuad), and others) are pure-TypeScript geometry over plain coordinate objects. See the [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv) namespace for the full list.

## Speech operations[​](#speech-operations "Direct link to Speech operations")

The [`speech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech) namespace's native operation is [`extractFrames`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/functions/extractFrames), which slices a mono waveform into overlapping, windowed frames — the front end of voice-activity detection and audio feature extraction.

```typescript
import { speech } from 'react-native-executorch';

// waveform [length] + Hann window [frameLength] → frames [numFrames, fftLength]
speech.extractFrames(tWaveform, tHann, tFrames, {
  numFrames: 100,
  hopLength: 160,
  preemphasis: 0.97,
});

```

The namespace also exports higher-level speech utilities — phonemizers, sentence partitioning, and voice-activity helpers — which are pure TypeScript rather than tensor operations.

## Tokenization and text (`nlp`)[​](#tokenization-and-text-nlp "Direct link to tokenization-and-text-nlp")

The [`nlp`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp) namespace turns text into token ids and back. [`loadTokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer) loads a HuggingFace tokenizer and returns a `Tokenizer` with `encode`, `decode`, and vocabulary lookups. Like the native primitives, a `Tokenizer` holds native resources and must be released with `dispose()`.

```typescript
import { nlp } from 'react-native-executorch';

const tokenizer = nlp.loadTokenizer('/path/to/tokenizer.json');
try {
  const ids = tokenizer.encode('hello world'); // Int32Array of token ids
  const text = tokenizer.decode(ids); // back to a string
} finally {
  tokenizer.dispose();
}

```

The namespace also provides privacy-filter utilities — such as [`piiSegments`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/piiSegments) for locating personally identifiable information in tokenized text. See the [`nlp`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp) namespace for the full set.

## Language models (`llm`)[​](#language-models-llm "Direct link to language-models-llm")

The [`llm`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm) namespace runs autoregressive language models. [`createLLMRunner`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner) pairs a model with its tokenizer and streams generated tokens, optionally with multimodal inputs when the model supports them.

```typescript
import { llm } from 'react-native-executorch';

const runner = llm.createLLMRunner('/path/to/model.pte', '/path/to/tokenizer.json');

```

For chat models, [`createChatPreprocessor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createChatPreprocessor) applies the model's chat template to a list of messages and prepares any image or audio content, and the tool-calling types let you define tools and parse tool calls out of generated text. See the [`llm`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm) namespace for the full set.

## Numeric helpers[​](#numeric-helpers "Direct link to Numeric helpers")

The `math` namespace also includes a few pure-TypeScript numeric utilities. They take and return plain numbers and typed arrays, and allocate their own result.

| Helper                                                                                                                                                         | Signature                           | Purpose                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| [`mulberry32`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/mulberry32)             | `mulberry32(seed)`                  | Seeded uniform RNG in `[0, 1)` — reproducible, unlike `Math.random`.           |
| [`randomNormal`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/randomNormal)         | `randomNormal(size, options?)`      | A `Float32Array` of normally distributed values, with an optional seed.        |
| [`repeatInterleave`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/repeatInterleave) | `repeatInterleave(values, repeats)` | Repeat each element by its matching count, like PyTorch's `repeat_interleave`. |

A seeded generator is useful wherever you need reproducible randomness — for example, seeding a diffusion model's initial latents so the same seed yields the same image:

```typescript
import { tensor, math } from 'react-native-executorch';

const latents = math.randomNormal(4 * 64 * 64, { seed: 42 });
const tLatents = tensor('float32', [1, 4, 64, 64], latents);

```

## Where to go next[​](#where-to-go-next "Direct link to Where to go next")

* [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md) — the `fn(src, dst)` convention and `through` chaining these operations build on.
* [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) — running these operations off the main thread.
* [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation.md) — matching a model to the tensors these operations produce.

### API reference[​](#api-reference "Direct link to API reference")

* Namespaces: [`math`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math) · [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv) · [`speech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech) · [`nlp`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp) · [`llm`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm)
* Math: [`sigmoid`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/sigmoid) · [`softmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/softmax) · [`argmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/argmax) · [`gather`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/gather) · [`threshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/threshold)
* CV: [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/resize) · [`cvtColor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/cvtColor) · [`toChannelsFirst`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/toChannelsFirst) · [`toChannelsLast`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/toChannelsLast) · [`normalize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/normalize) · [`applyColormap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/functions/applyColormap)
* Speech: [`extractFrames`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech/functions/extractFrames)
* NLP: [`loadTokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer) · [`piiSegments`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/piiSegments)
* LLM: [`createLLMRunner`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner) · [`createChatPreprocessor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createChatPreprocessor)
* Numeric helpers: [`mulberry32`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/mulberry32) · [`randomNormal`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/randomNormal) · [`repeatInterleave`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/repeatInterleave)
