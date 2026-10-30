---
title: Translation
slug: /extensions/translation
description: 'Translate text between languages fully on-device in React Native with Opus-MT, EuroLLM and Hy-MT2 models.'
keywords:
  [
    react native,
    translation,
    machine translation,
    opus-mt,
    marian,
    eurollm,
    hy-mt2,
    mobile ml,
    on-device ai,
  ]
---

# Translation

Translation models turn text in one language into another without sending it off the device. Two kinds are available behind the same API:

- [Opus-MT](https://github.com/Helsinki-NLP/Opus-MT): small (~110 MB) and fast, one model per language pair, such as English to German.
- [EuroLLM-1.7B-Instruct](https://huggingface.co/utter-project/EuroLLM-1.7B-Instruct): one 1.7 GB model that translates between any two of its 35 languages.
- [Hy-MT2-1.8B](https://huggingface.co/tencent/Hy-MT2-1.8B): one 1.2 GB model that translates between any two of its 38 languages and dialects, and is stronger than EuroLLM on Chinese.

## Quick Start

The [`useTranslator`](../../06-api-reference/functions/useTranslator.md) hook downloads the `.pte` model and tokenizer, loads the pipeline, and manages its lifecycle. Every call names its language pair as ISO 639-1 codes:

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

    const german = await translator.translate(text, { sourceLanguage: 'en', targetLanguage: 'de' });
    console.log(german);
  };
}
```

An Opus-MT model accepts only its own pair. With `models.translation.EUROLLM_1_7B.DEFAULT` or `models.translation.HY_MT2_1_8B.DEFAULT`, the pair can change on every call without reloading the model.

## Streaming

Pass a callback to receive the translation as it is decoded. Each call gets the newly decoded piece of text; joined together, the pieces equal the returned translation.

```typescript
let partial = '';
const result = await translator.translate('How are you? I am fine.', languages, (piece) => {
  partial += piece;
  setText(partial);
});
```

Call [`translateStop()`](../../06-api-reference/type-aliases/Translator.md#translatestop) to cancel; [`translate()`](../../06-api-reference/type-aliases/Translator.md#translate) then resolves with the text translated so far.

## How Input Is Processed

Line breaks are kept in the output for both kinds of model.

- **Opus-MT** models are trained on single sentences, so the input is split after sentence-ending punctuation (`.`, `!`, `?`) and at line breaks, and each sentence is translated on its own. A single sentence longer than the model's maximum source length (256 tokens) is truncated, and one sentence translates to at most 256 tokens.
- **EuroLLM** and **Hy-MT2** translate each line on their own with the model card's prompt, decoding greedily. A line and its translation together must fit the 1024-token context.

EuroLLM supports Arabic (`ar`), Bulgarian (`bg`), Catalan (`ca`), Chinese (`zh`), Croatian (`hr`), Czech (`cs`), Danish (`da`), Dutch (`nl`), English (`en`), Estonian (`et`), Finnish (`fi`), French (`fr`), Galician (`gl`), German (`de`), Greek (`el`), Hindi (`hi`), Hungarian (`hu`), Irish (`ga`), Italian (`it`), Japanese (`ja`), Korean (`ko`), Latvian (`lv`), Lithuanian (`lt`), Maltese (`mt`), Norwegian (`no`), Polish (`pl`), Portuguese (`pt`), Romanian (`ro`), Russian (`ru`), Slovak (`sk`), Slovenian (`sl`), Spanish (`es`), Swedish (`sv`), Turkish (`tr`) and Ukrainian (`uk`).

Hy-MT2 supports Arabic (`ar`), Bengali (`bn`), Burmese (`my`), Cantonese (`yue`), Chinese (`zh`), Traditional Chinese (`zh-Hant`), Czech (`cs`), Dutch (`nl`), English (`en`), Filipino (`tl`), French (`fr`), German (`de`), Gujarati (`gu`), Hebrew (`he`), Hindi (`hi`), Indonesian (`id`), Italian (`it`), Japanese (`ja`), Kazakh (`kk`), Khmer (`km`), Korean (`ko`), Malay (`ms`), Marathi (`mr`), Mongolian (`mn`), Persian (`fa`), Polish (`pl`), Portuguese (`pt`), Russian (`ru`), Spanish (`es`), Tamil (`ta`), Telugu (`te`), Thai (`th`), Tibetan (`bo`), Turkish (`tr`), Ukrainian (`uk`), Urdu (`ur`), Uyghur (`ug`) and Vietnamese (`vi`).

## Imperative API

For use outside React components, create the pipeline with [`createMarianTranslator`](../../06-api-reference/functions/createMarianTranslator.md) or [`createLLMTranslator`](../../06-api-reference/functions/createLLMTranslator.md):

```typescript
import { createLLMTranslator, download, models } from 'react-native-executorch';

const model = await download(models.translation.EUROLLM_1_7B.DEFAULT);
const translator = await createLLMTranslator(model);

try {
  console.log(
    await translator.translate('The weather is nice today.', {
      sourceLanguage: 'en',
      targetLanguage: 'pl',
    })
  );
} finally {
  translator.dispose();
}
```

[`translateWorklet`](../../06-api-reference/type-aliases/MarianTranslator.md#translateworklet) runs the Opus-MT pipeline synchronously on a worklet runtime. See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md).

## Available Models

The models are available in [`models.translation`](../../06-api-reference/variables/models.md#translation):

| Model           | Direction               | Size                | Supported Backends            |
| :-------------- | :---------------------- | :------------------ | :---------------------------- |
| `OPUS_MT_EN_DE` | English → German        | 107 MB              | XNNPACK (CPU)                 |
| `OPUS_MT_DE_EN` | German → English        | 107 MB              | XNNPACK (CPU)                 |
| `OPUS_MT_EN_ES` | English → Spanish       | 114 MB              | XNNPACK (CPU)                 |
| `OPUS_MT_ES_EN` | Spanish → English       | 114 MB              | XNNPACK (CPU)                 |
| `OPUS_MT_EN_FR` | English → French        | 108 MB              | XNNPACK (CPU)                 |
| `OPUS_MT_FR_EN` | French → English        | 108 MB              | XNNPACK (CPU)                 |
| `EUROLLM_1_7B`  | Any of its 35 languages | 1.7 GB              | XNNPACK (CPU), MLX (iOS, GPU) |
| `HY_MT2_1_8B`   | Any of its 38 languages | 1.2 GB (MLX 1.8 GB) | XNNPACK (CPU), MLX (iOS, GPU) |

:::info License
`OPUS_MT_EN_DE` is licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) and requires attribution to the [Helsinki-NLP Opus-MT](https://huggingface.co/Helsinki-NLP/opus-mt-en-de) project. The other Opus-MT pairs, EuroLLM and Hy-MT2 are Apache-2.0.
:::

## API Reference

### Hooks & Pipelines

- [`useTranslator()`](../../06-api-reference/functions/useTranslator.md) — React hook for translation model downloading, state, and lifecycle.
- [`createMarianTranslator()`](../../06-api-reference/functions/createMarianTranslator.md) — Imperative factory for Opus-MT translation pipelines.
- [`createLLMTranslator()`](../../06-api-reference/functions/createLLMTranslator.md) — Imperative factory for EuroLLM and Hy-MT2 translation pipelines.

### Types

- [`Translator`](../../06-api-reference/type-aliases/Translator.md) — Translator runner interface ([`translate`](../../06-api-reference/type-aliases/Translator.md#translate), [`translateStop`](../../06-api-reference/type-aliases/Translator.md#translatestop)).
- [`TranslationLanguages`](../../06-api-reference/type-aliases/TranslationLanguages.md) — Source and target language of one call.
- [`TranslatorModel`](../../06-api-reference/type-aliases/TranslatorModel.md) — Any translation model configuration.
- [`MarianTranslator`](../../06-api-reference/type-aliases/MarianTranslator.md) — Opus-MT runner, which adds [`translateWorklet`](../../06-api-reference/type-aliases/MarianTranslator.md#translateworklet).
- [`MarianTranslatorModel`](../../06-api-reference/type-aliases/MarianTranslatorModel.md) — Opus-MT configuration with model path, tokenizer path, and language pair.
- [`LLMTranslatorModel`](../../06-api-reference/type-aliases/LLMTranslatorModel.md) — EuroLLM or Hy-MT2 configuration with model, tokenizer, and tokenizer config paths.

### Model Presets

- [`models.translation`](../../06-api-reference/variables/models.md#translation) — Pre-configured translation models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/nlp/tasks/marianTranslation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/nlp/tasks/marianTranslation.ts)
- [`src/extensions/llm/tasks/llmTranslation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/llm/tasks/llmTranslation.ts)
  :::
