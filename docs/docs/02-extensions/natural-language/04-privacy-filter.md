---
title: Privacy Filter
slug: /extensions/privacy-filter
description: 'Detect and redact Personally Identifiable Information (PII) like names, emails, phone numbers, and secrets directly on-device in React Native.'
keywords:
  [
    react native,
    privacy filter,
    pii detection,
    redaction,
    anonymization,
    bioes,
    viterbi,
    openai,
    nemotron,
    mobile ml,
    on-device ai,
  ]
---

# Privacy Filter

Privacy Filter models detect Personally Identifiable Information (PII) — such as personal names, email addresses, phone numbers, physical addresses, API keys, and credentials — in natural language text.

By scanning text entirely on-device before sending prompts to cloud APIs, logging systems, or analytics backends, you can automatically redact or mask sensitive user data without exposing personal details over the network.

<!-- GIF DEMO PLACEHOLDER: Place privacy filter demo gif here, e.g. ![Privacy Filter Demo](./media/privacy-filter.gif) -->

## Quick Start

The [`usePrivacyFilter`](../../06-api-reference/functions/usePrivacyFilter.md) hook downloads the `.pte` model and tokenizer files, initializes the native token classification pipeline, and manages lifecycle:

```tsx
import { models, usePrivacyFilter } from 'react-native-executorch';

function MyComponent() {
  const filter = usePrivacyFilter(models.privacyFilter.OPENAI.DEFAULT);

  // Hook state:
  // filter.isReady          — true once model and tokenizer are downloaded and loaded in memory
  // filter.downloadProgress — 0.0 to 1.0 download progress
  // filter.error            — Error instance if download or load failed

  const handleScan = async (rawText: string) => {
    if (!filter.isReady || !filter.detectPii) return;

    // Detect all PII entity spans
    const entities = await filter.detectPii(rawText);
    console.log('Detected PII spans:', entities);
  };

  // Trigger handleScan on submit or before forwarding text to network
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/privacy-filter.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/privacy-filter.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for an interactive redaction demo with highlighted spans and entity replacement.
:::

## Output Format

`detectPii()` returns an array of [`PiiEntity`](../../06-api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md) objects representing detected spans:

```typescript
const entities = await filter.detectPii(
  'Contact John Doe at john.doe@example.com or (555) 019-2834.'
);
```

Each [`PiiEntity`](../../06-api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md) object contains:

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

### Redacting & Masking Text

Using the exact character indices `charStart` and `charEnd`, you can sanitize or mask private information before logging or sending text to third-party endpoints:

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

## Sliding Window & Viterbi Decoding

- **Sliding Window Processing**: Long text documents exceeding the model's sequence length are automatically partitioned into overlapping sliding windows (with 50% overlap). Predictions near window edges are discarded in favor of centered contexts, ensuring long texts are never truncated.
- **BIOES Grammar & Viterbi Decoding**: Raw per-token logits are parsed through an optimal, grammar-constrained Viterbi decoder in pure TypeScript (linear time complexity) to ensure grammatically valid entity boundaries (`Begin`, `Inside`, `End`, `Single`).

## Imperative API

For background workers, pre-request network interceptors, or manual lifecycle management outside React components, create the pipeline using [`createPrivacyFilter`](../../06-api-reference/functions/createPrivacyFilter.md):

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

## Synchronous Execution

For synchronous execution on worklet runtimes or frame processors without Promise scheduling overhead, `createPrivacyFilter` exposes `detectPiiWorklet`:

```typescript
// Called synchronously inside a worklet runtime
const entities = filter.detectPiiWorklet(rawString);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use privacy filter models from the [Software Mansion HuggingFace Privacy Filter Collection](https://huggingface.co/collections/software-mansion/privacy-filter), available in [`models.privacyFilter`](../../06-api-reference/variables/models.md#privacyfilter):

| Model Family                | Variants                                                                | Labels / Categories        | Size Range         | Supported Backends         | Notes                                                                       |
| :-------------------------- | :---------------------------------------------------------------------- | :------------------------- | :----------------- | :------------------------- | :-------------------------------------------------------------------------- |
| **OpenAI Privacy Filter**   | [See](../../06-api-reference/variables/models.md#privacyfilteropenai)   | 8 common categories        | 834.5 MB – 1.16 GB | XNNPACK (CPU), MLX (Apple) | General user data redaction and pre-LLM prompt sanitization.                |
| **Nemotron Privacy Filter** | [See](../../06-api-reference/variables/models.md#privacyfilternemotron) | 55 fine-grained categories | 1.16 GB – 1.47 GB  | XNNPACK (CPU), MLX (Apple) | Strict compliance, tax IDs, credentials, and enterprise security redaction. |

:::tip Using Custom Models
To use your own fine-tuned token classification `.pte` model, pass a [`PrivacyFilterModel`](../../06-api-reference/type-aliases/PrivacyFilterModel.md) configuration object to `usePrivacyFilter` or `createPrivacyFilter`:

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

The pipeline automatically verifies that the model exports `forward(input_ids, attention_mask) -> logits` matching the label space. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`usePrivacyFilter()`](../../06-api-reference/functions/usePrivacyFilter.md) — React hook for privacy filter model downloading, state, and lifecycle.
- [`createPrivacyFilter()`](../../06-api-reference/functions/createPrivacyFilter.md) — Imperative factory for privacy filter pipelines.

### Types & Options

- [`PrivacyFilter`](../../06-api-reference/type-aliases/PrivacyFilter.md) — Privacy filter runner interface (`detectPii`, `detectPiiWorklet`).
- [`PiiEntity`](../../06-api-reference/react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md) — Detected entity span object (`label`, `text`, `charStart`, `charEnd`, `startToken`, `endToken`).
- [`PrivacyFilterModel`](../../06-api-reference/type-aliases/PrivacyFilterModel.md) — Model configuration spec with model path, tokenizer path, and model options.
- [`PrivacyFilterOptions`](../../06-api-reference/type-aliases/PrivacyFilterOptions.md) — Label space definitions and Viterbi biases.

### Model Presets

- [`models.privacyFilter`](../../06-api-reference/variables/models.md#privacyfilter) — Pre-configured privacy filter models registry.
