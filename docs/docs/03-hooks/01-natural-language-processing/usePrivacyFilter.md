---
title: usePrivacyFilter
keywords:
  [
    privacy filter,
    pii detection,
    pii,
    personally identifiable information,
    privacy,
    redaction,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Detect personally identifiable information (PII) in text on-device with React Native ExecuTorch's usePrivacyFilter hook."
---

Privacy Filter is a token-level model that scans text for personally identifiable information (PII) — names, emails, phone numbers, addresses, SSNs, secrets, and more — and returns the detected spans together with the entity type. Inference runs entirely on-device, so the input text never leaves the user's phone.

:::info
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/privacy-filter). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `usePrivacyFilter` see: [`usePrivacyFilter` API Reference](../../06-api-reference/functions/usePrivacyFilter.md).
- For all Privacy Filter models available out-of-the-box in React Native ExecuTorch see: [Privacy Filter Models](../../06-api-reference/index.md#models---privacy-filter).

## High Level Overview

```typescript
import {
  usePrivacyFilter,
  PRIVACY_FILTER_OPENAI,
} from 'react-native-executorch';

const model = usePrivacyFilter({ model: PRIVACY_FILTER_OPENAI });

try {
  const entities = await model.generate(
    'My name is Sarah Chen and my email is sarah@example.com.'
  );
  console.log(entities);
  // [
  //   { label: 'private_person', text: 'Sarah Chen', startToken: 3, endToken: 5 },
  //   { label: 'private_email',  text: 'sarah@example.com', startToken: 11, endToken: 14 },
  // ]
} catch (error) {
  console.error(error);
}
```

### Arguments

`usePrivacyFilter` takes [`PrivacyFilterProps`](../../06-api-reference/interfaces/PrivacyFilterProps.md) that consists of:

- `model` of type [`PrivacyFilterModelSources`](../../06-api-reference/interfaces/PrivacyFilterModelSources.md) containing the model source, tokenizer source, and BIOES label list.
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/PrivacyFilterProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `usePrivacyFilter` arguments check this section: [`usePrivacyFilter` arguments](../../06-api-reference/functions/usePrivacyFilter.md#parameters).
- For all Privacy Filter models available out-of-the-box in React Native ExecuTorch see: [Privacy Filter Models](../../06-api-reference/index.md#models---privacy-filter).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`usePrivacyFilter` returns an object called `PrivacyFilterType` containing a `generate` function for running detection. To get more details please read: [`PrivacyFilterType` API Reference](../../06-api-reference/interfaces/PrivacyFilterType.md).

## Running the model

To run the model, call the [`generate`](../../06-api-reference/interfaces/PrivacyFilterType.md#generate) method with the text you want to scan. The method returns a promise that resolves to an array of [`PiiEntity`](../../06-api-reference/interfaces/PiiEntity.md) objects, each describing one detected span (`label`, decoded `text`, and inclusive `startToken` / exclusive `endToken` indices into the tokenized input).

Inputs are processed in sliding 256-token windows with 50% overlap, so there is no length limit — long documents are scanned end-to-end without truncation.

:::note
Token indices in returned entities are positions in the tokenizer's output (the unpadded `encode()` stream), not character offsets in the original string. Use the entity's decoded `text` field if you want to display or redact spans verbatim.
:::

### Tuning precision and recall

Both built-in models ship with neutral, validity-only Viterbi decoding by default. If you want to shift the precision/recall tradeoff, pass an optional [`viterbiBiases`](../../06-api-reference/interfaces/PrivacyFilterModelSources.md#viterbibiases) object — six floats matching the operating-point schema in OpenAI's `viterbi_calibration.json`. Negative `backgroundToStart` makes the decoder enter spans more eagerly (higher recall); positive `backgroundStay` keeps it in the background label more often (higher precision).

## Example

```tsx
import React, { useState } from 'react';
import { Button, Text, View, TextInput, ScrollView } from 'react-native';
import {
  usePrivacyFilter,
  PRIVACY_FILTER_OPENAI,
  PiiEntity,
} from 'react-native-executorch';

export default function App() {
  const model = usePrivacyFilter({ model: PRIVACY_FILTER_OPENAI });
  const [text, setText] = useState(
    'My name is Sarah Chen and you can reach me at sarah.chen@example.com.'
  );
  const [entities, setEntities] = useState<PiiEntity[]>([]);

  const handleScan = async () => {
    if (!model.isReady) {
      console.error('Privacy Filter model is not loaded yet.');
      return;
    }
    try {
      const detected = await model.generate(text);
      setEntities(detected);
    } catch (error) {
      console.error('Error during running Privacy Filter model', error);
    }
  };

  return (
    <ScrollView>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        style={{ borderWidth: 1, padding: 8, minHeight: 120 }}
      />
      <Button
        onPress={handleScan}
        title="Detect PII"
        disabled={!model.isReady}
      />
      {entities.map((entity, idx) => (
        <View key={idx} style={{ paddingVertical: 4 }}>
          <Text>
            {entity.label}:{' '}
            <Text style={{ fontWeight: 'bold' }}>{entity.text}</Text>
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

## Supported models

| Model                                                                                          | Categories | Description                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | :--------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [openai/privacy-filter](https://huggingface.co/openai/privacy-filter)                          |     8      | OpenAI's base PII detector. Covers names, emails, phone numbers, addresses, dates of birth, URLs, and generic secrets / API keys.                                     |
| [OpenMed/privacy-filter-nemotron](https://huggingface.co/OpenMed/privacy-filter-nemotron-base) |    55+     | Fine-tune of the base model with a much wider label space — adds medical, financial, demographic, technical, and government-document categories on top of the base 8. |

**`Categories`** — The number of distinct entity types the model can emit. Both models share the same backbone (256-token windows, 128-token banded attention) and tokenizer (o200k); they differ only in the BIOES label space.
