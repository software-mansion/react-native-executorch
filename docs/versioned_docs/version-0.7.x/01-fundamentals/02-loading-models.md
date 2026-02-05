---
title: Loading Models
---

There are three different methods available for loading model files, depending on their size and location.

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
