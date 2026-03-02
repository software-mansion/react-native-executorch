---
title: Loading Models
---

There are three different methods available for loading model files, depending on their size and location.

## Prerequisites

In our library, you can use two different resource fetching mechanisms. One is implemented using Expo FileSystem, the other one uses external library. We encourage you to use implementation utilizing Expo if possible.

To use the Expo adapter, please add these libraries:

```bash
yarn add @react-native-executorch/expo-adapter
yarn add expo-file-system expo-asset
```

and then add the following code in your React Native app:

```typescript
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from '@react-native-executorch/expo-resource-fetcher';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});
```

If you cannot use Expo in your project, proceed with the following steps:

```bash
yarn add @react-native-executorch/bare-adapter
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
```

and

```typescript
import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from '@react-native-executorch/bare-adapter';

initExecutorch({
  resourceFetcher: BareResourceFetcher,
});
```

**1. Load from React Native assets folder (For Files < 512MB)**

```typescript
useExecutorchModule({
  modelSource: require('../assets/llama3_2.pte'),
});
```

**2. Load from remote URL:**

For files larger than 512MB or when you want to keep size of the app smaller, you can load the model from a remote URL (e.g. HuggingFace).

```typescript
useExecutorchModule({
  modelSource: 'https://.../llama3_2.pte',
});
```

**3. Load from local file system:**

If you prefer to delegate the process of obtaining and loading model and tokenizer files to the user, you can use the following method:

```typescript
useExecutorchModule({
  modelSource: 'file:///var/mobile/.../llama3_2.pte',
});
```

:::info
The downloaded files are stored in documents directory of your application.
:::

## Predefined Models

Our library offers out-of-the-box support for multiple models. To make things easier, we created aliases for our model exported to `pte` format. For full list of aliases, check out: [API Reference](../06-api-reference/index.md#models---classification)

## Example

The following code snippet demonstrates how to load model and tokenizer files using `useLLM` hook:

```typescript
import { useLLM } from 'react-native-executorch';

const llama = useLLM({
  modelSource: 'https://.../llama3_2.pte',
  tokenizerSource: require('../assets/tokenizer.bin'),
});
```
