# usePrivacyFilter

Privacy Filter is a token-level model that scans text for personally identifiable information (PII) — names, emails, phone numbers, addresses, SSNs, secrets, and more — and returns the detected spans together with the entity type. Inference runs entirely on-device, so the input text never leaves the user's phone.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/privacy-filter). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `usePrivacyFilter` see: [`usePrivacyFilter` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePrivacyFilter).
* For all Privacy Filter models available out-of-the-box in React Native ExecuTorch see: [Privacy Filter Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---privacy-filter).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, usePrivacyFilter } from 'react-native-executorch';
const model = usePrivacyFilter({ model: models.privacy_filter.openai() });

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

### Arguments[​](#arguments "Direct link to Arguments")

`usePrivacyFilter` takes [`PrivacyFilterProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PrivacyFilterProps) that consists of:

* `model` of type [`PrivacyFilterModelSources`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PrivacyFilterModelSources) containing the model source, tokenizer source, and BIOES label list.
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PrivacyFilterProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `usePrivacyFilter` arguments check this section: [`usePrivacyFilter` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePrivacyFilter#parameters).
* For all Privacy Filter models available out-of-the-box in React Native ExecuTorch see: [Privacy Filter Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---privacy-filter).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`usePrivacyFilter` returns an object called `PrivacyFilterType` containing a `generate` function for running detection. To get more details please read: [`PrivacyFilterType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PrivacyFilterType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, call the [`generate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PrivacyFilterType#generate) method with the text you want to scan. The method returns a promise that resolves to an array of [`PiiEntity`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PiiEntity) objects, each describing one detected span (`label`, decoded `text`, and inclusive `startToken` / exclusive `endToken` indices into the tokenized input).

Inputs are processed in sliding windows with 50% overlap (the window size matches the model's exported `forward` input shape), so there is no length limit — long documents are scanned end-to-end without truncation.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Token indices in returned entities are positions in the tokenizer's output (the unpadded `encode()` stream), not character offsets in the original string. Use the entity's decoded `text` field if you want to display or redact spans verbatim.

### Tuning precision and recall[​](#tuning-precision-and-recall "Direct link to Tuning precision and recall")

Both built-in models ship with neutral, validity-only Viterbi decoding by default. If you want to shift the precision/recall tradeoff, pass an optional [`viterbiBiases`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PrivacyFilterModelSources#viterbibiases) object — six floats matching the operating-point schema in OpenAI's `viterbi_calibration.json`. Negative `backgroundToStart` makes the decoder enter spans more eagerly (higher recall); positive `backgroundStay` keeps it in the background label more often (higher precision).

## Example[​](#example "Direct link to Example")

```tsx
import React, { useState } from 'react';
import { Button, Text, View, TextInput, ScrollView } from 'react-native';
import { models, usePrivacyFilter, PiiEntity } from 'react-native-executorch';
export default function App() {
  const model = usePrivacyFilter({ model: models.privacy_filter.openai() });
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

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                          | Categories | Description                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [openai/privacy-filter](https://huggingface.co/openai/privacy-filter)                          | 8          | OpenAI's base PII detector. Covers names, emails, phone numbers, addresses, dates of birth, URLs, and generic secrets / API keys.                                     |
| [OpenMed/privacy-filter-nemotron](https://huggingface.co/OpenMed/privacy-filter-nemotron-base) | 55+        | Fine-tune of the base model with a much wider label space — adds medical, financial, demographic, technical, and government-document categories on top of the base 8. |

**`Categories`** — The number of distinct entity types the model can emit. Both models share the same backbone (256-token windows, 128-token banded attention) and tokenizer (o200k); they differ only in the BIOES label space.
