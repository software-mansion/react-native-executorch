# Privacy Filter

Privacy Filter models detect Personally Identifiable Information (PII) — such as personal names, email addresses, phone numbers, physical addresses, API keys, and credentials — in natural language text.

By scanning text entirely on-device before sending prompts to cloud APIs, logging systems, or analytics backends, you can automatically redact or mask sensitive user data without exposing personal details over the network.

| iOS                                                       | Android                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| [](/react-native-executorch/media/privacy-filter-ios.mp4) | [](/react-native-executorch/media/privacy-filter-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`usePrivacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePrivacyFilter) hook downloads the `.pte` model and tokenizer files, initializes the native token classification pipeline, and manages lifecycle:

```tsx
import { models, usePrivacyFilter } from 'react-native-executorch';

function MyComponent() {
  const filter = usePrivacyFilter(models.privacyFilter.OPENAI.DEFAULT);

  // Hook state:
  // filter.isReady          — true once model and tokenizer are downloaded and loaded in memory
  // filter.downloadProgress — 0 to 100 download progress
  // filter.error            — Error instance if download or load failed
  // filter.resource         — resolved config with all URLs replaced by local file paths

  const handleScan = async (rawText: string) => {
    if (!filter.isReady || !filter.detectPii) return;

    // Detect all PII entity spans
    const entities = await filter.detectPii(rawText);
    console.log('Detected PII spans:', entities);
  };

  // Trigger handleScan on submit or before forwarding text to network
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/privacy-filter.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/privacy-filter.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for an interactive redaction demo with highlighted spans and entity replacement.

## Output Format[​](#output-format "Direct link to Output Format")

[`detectPii()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilter#detectpii) returns an array of [`PiiEntity`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity) objects representing detected spans:

```typescript
const entities = await filter.detectPii(
  'Contact John Doe at john.doe@example.com or (555) 019-2834.'
);

```

Each [`PiiEntity`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity) object contains:

```typescript
interface PiiEntity<Label extends string = string> {
  /** Entity category (e.g. 'private_person', 'private_email', 'private_phone') */
  readonly label: Label;
  /** Extracted text of the span */
  readonly text: string;
  /** Inclusive UTF-16 character start index in the original string */
  readonly charStart: number;
  /** Exclusive UTF-16 character end index in the original string */
  readonly charEnd: number;
  /** Inclusive start token index */
  readonly startToken: number;
  /** Exclusive end token index */
  readonly endToken: number;
}

```

### Redacting & Masking Text[​](#redacting--masking-text "Direct link to Redacting & Masking Text")

Using the exact character indices [`charStart`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#charstart) and [`charEnd`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#charend), you can sanitize or mask private information before logging or sending text to third-party endpoints:

```typescript
function redactText(text: string, entities: readonly PiiEntity[]): string {
  // Sort spans in reverse order to preserve string indices while slicing
  const sorted = [...entities].sort((a, b) => b.charStart - a.charStart);

  let sanitized = text;
  for (const entity of sorted) {
    const mask = `[${entity.label.toUpperCase()}]`;
    sanitized = sanitized.slice(0, entity.charStart) + mask + sanitized.slice(entity.charEnd);
  }
  return sanitized;
}

const input = 'Call Alice at 555-123-4567 regarding invoice #9812.';
const detected = await filter.detectPii(input);
const sanitized = redactText(input, detected);
console.log(sanitized);
// "Call [PRIVATE_PERSON] at [PRIVATE_PHONE] regarding invoice #9812."

```

## Sliding Window & Viterbi Decoding[​](#sliding-window--viterbi-decoding "Direct link to Sliding Window & Viterbi Decoding")

* **Sliding Window Processing**: Long text documents exceeding the model's sequence length are automatically partitioned into overlapping sliding windows (with 50% overlap). Predictions near window edges are discarded in favor of centered contexts, ensuring long texts are never truncated.
* **BIOES Grammar & Viterbi Decoding**: Raw per-token logits are parsed through an optimal, grammar-constrained Viterbi decoder in pure TypeScript (linear time complexity) to ensure grammatically valid entity boundaries (`Begin`, `Inside`, `End`, `Single`).

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background workers, pre-request network interceptors, or manual lifecycle management outside React components, create the pipeline using [`createPrivacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPrivacyFilter):

```typescript
import { createPrivacyFilter, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the imperative pipeline
const model = await download(models.privacyFilter.OPENAI.DEFAULT);
const filter = await createPrivacyFilter(model);

try {
  const entities = await filter.detectPii('User prompt with secret credentials');
  console.log('Detected PII:', entities);
} finally {
  // Always release native resources when finished
  filter.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For synchronous execution on worklet runtimes or frame processors without Promise scheduling overhead, [`createPrivacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPrivacyFilter) exposes [`detectPiiWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilter#detectpiiworklet):

```typescript
// Called synchronously inside a worklet runtime
const entities = filter.detectPiiWorklet(rawString);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use privacy filter models from the [Software Mansion HuggingFace Privacy Filter Collection](https://huggingface.co/collections/software-mansion/privacy-filter), available in [`models.privacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#privacyfilter):

| Model Family                | Variants                                                                                                            | Labels / Categories                                                                                                                                                             | Size Range         | Supported Backends         | Notes                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------- | --------------------------------------------------------------------------- |
| **OpenAI Privacy Filter**   | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#privacyfilteropenai)   | [`PRIVACY_FILTER_OPENAI_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/PRIVACY_FILTER_OPENAI_LABELS) (8 common categories)            | 834.5 MB – 1.16 GB | XNNPACK (CPU), MLX (Apple) | General user data redaction and pre-LLM prompt sanitization.                |
| **Nemotron Privacy Filter** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#privacyfilternemotron) | [`PRIVACY_FILTER_NEMOTRON_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/PRIVACY_FILTER_NEMOTRON_LABELS) (55 fine-grained categories) | 1.16 GB – 1.47 GB  | XNNPACK (CPU), MLX (Apple) | Strict compliance, tax IDs, credentials, and enterprise security redaction. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned token classification `.pte` model, pass a [`PrivacyFilterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilterModel) configuration object to [`usePrivacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePrivacyFilter) or [`createPrivacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPrivacyFilter):

```typescript
const customFilter = await createPrivacyFilter({
  modelPath: 'https://example.com/my-pii-model.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
  modelOpts: {
    labelNames: ['O', 'B-NAME', 'I-NAME', 'E-NAME', 'S-NAME'],
    padTokenId: 0,
  },
});

```

The pipeline automatically verifies that the model exports `forward(input_ids, attention_mask) -> logits` matching the label space. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`usePrivacyFilter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePrivacyFilter) — React hook for privacy filter model downloading, state, and lifecycle.
* [`createPrivacyFilter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPrivacyFilter) — Imperative factory for privacy filter pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`PrivacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilter) — Privacy filter runner interface ([`detectPii`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilter#detectpii), [`detectPiiWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilter#detectpiiworklet)).
* [`PiiEntity`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity) — Detected entity span object ([`label`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#label), [`text`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#text), [`charStart`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#charstart), [`charEnd`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#charend), [`startToken`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#starttoken), [`endToken`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity#endtoken)).
* [`PrivacyFilterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilterModel) — Model configuration spec with model path, tokenizer path, and model options.
* [`PrivacyFilterOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PrivacyFilterOptions) — Label space definitions and Viterbi biases.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.privacyFilter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#privacyfilter) — Pre-configured privacy filter models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/nlp/tasks/privacyFilter.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts)
