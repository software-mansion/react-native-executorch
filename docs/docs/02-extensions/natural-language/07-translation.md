---
title: Translation
slug: /extensions/translation
description: 'Translate text between languages fully on-device in React Native with Opus-MT models.'
keywords: [react native, translation, machine translation, opus-mt, marian, mobile ml, on-device ai]
---

# Translation

Translation models turn text in one language into another without sending it off the device. Each [Opus-MT](https://github.com/Helsinki-NLP/Opus-MT) model translates one fixed language pair, such as English to German.

## Quick Start

The [`useTranslator`](../../06-api-reference/functions/useTranslator.md) hook downloads the `.pte` model and tokenizer, loads the pipeline, and manages its lifecycle:

```tsx
import { models, useTranslator } from 'react-native-executorch';

function MyComponent() {
  const translator = useTranslator(models.translation.OPUS_MT_EN_DE.DEFAULT);

  // Hook state:
  // translator.isReady          — true once model and tokenizer are loaded
  // translator.downloadProgress — 0 to 100 download progress
  // translator.error            — Error instance if download or load failed

  const handleTranslate = async (text: string) => {
    if (!translator.isReady || !translator.translate) return;

    const german = await translator.translate(text);
    console.log(german);
  };
}
```

## Streaming

Pass a callback to receive the translation as it is decoded. Each call gets the newly decoded piece of text; joined together, the pieces equal the returned translation.

```typescript
let partial = '';
const result = await translator.translate('How are you? I am fine.', (piece) => {
  partial += piece;
  setText(partial);
});
```

Call [`translateStop()`](../../06-api-reference/type-aliases/MarianTranslator.md#translatestop) to cancel; [`translate()`](../../06-api-reference/type-aliases/MarianTranslator.md#translate) then resolves with the text translated so far.

## How Input Is Processed

Opus-MT models are trained on single sentences, so the input is split after sentence-ending punctuation (`.`, `!`, `?`) and at line breaks, and each sentence is translated on its own. Line breaks are kept in the output. A single sentence longer than the model's maximum source length (256 tokens) is truncated, and one sentence translates to at most 256 tokens.

## Imperative API

For use outside React components, create the pipeline with [`createMarianTranslator`](../../06-api-reference/functions/createMarianTranslator.md):

```typescript
import { createMarianTranslator, download, models } from 'react-native-executorch';

const model = await download(models.translation.OPUS_MT_EN_FR.DEFAULT);
const translator = await createMarianTranslator(model);

try {
  console.log(await translator.translate('The weather is nice today.'));
} finally {
  translator.dispose();
}
```

[`translateWorklet`](../../06-api-reference/type-aliases/MarianTranslator.md#translateworklet) runs the same pipeline synchronously on a worklet runtime. See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md).

## Available Models

The models are available in [`models.translation`](../../06-api-reference/variables/models.md#translation):

| Model           | Direction         | Size   | Supported Backends |
| :-------------- | :---------------- | :----- | :----------------- |
| `OPUS_MT_EN_DE` | English → German  | 107 MB | XNNPACK (CPU)      |
| `OPUS_MT_DE_EN` | German → English  | 107 MB | XNNPACK (CPU)      |
| `OPUS_MT_EN_ES` | English → Spanish | 114 MB | XNNPACK (CPU)      |
| `OPUS_MT_ES_EN` | Spanish → English | 114 MB | XNNPACK (CPU)      |
| `OPUS_MT_EN_FR` | English → French  | 108 MB | XNNPACK (CPU)      |
| `OPUS_MT_FR_EN` | French → English  | 108 MB | XNNPACK (CPU)      |

:::info License
`OPUS_MT_EN_DE` is licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) and requires attribution to the [Helsinki-NLP Opus-MT](https://huggingface.co/Helsinki-NLP/opus-mt-en-de) project. The other pairs are Apache-2.0.
:::

## API Reference

### Hooks & Pipelines

- [`useTranslator()`](../../06-api-reference/functions/useTranslator.md) — React hook for translation model downloading, state, and lifecycle.
- [`createMarianTranslator()`](../../06-api-reference/functions/createMarianTranslator.md) — Imperative factory for Opus-MT translation pipelines.

### Types

- [`MarianTranslator`](../../06-api-reference/type-aliases/MarianTranslator.md) — Translator runner interface ([`translate`](../../06-api-reference/type-aliases/MarianTranslator.md#translate), [`translateWorklet`](../../06-api-reference/type-aliases/MarianTranslator.md#translateworklet), [`translateStop`](../../06-api-reference/type-aliases/MarianTranslator.md#translatestop)).
- [`MarianTranslatorModel`](../../06-api-reference/type-aliases/MarianTranslatorModel.md) — Model configuration with model path, tokenizer path, and language pair.

### Model Presets

- [`models.translation`](../../06-api-reference/variables/models.md#translation) — Pre-configured translation models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/nlp/tasks/marianTranslation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/nlp/tasks/marianTranslation.ts)
  :::
