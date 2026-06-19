---
title: Loading Models
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

There are three different methods available for loading model files, depending on their size and location.

## Prerequisites

In our library, you can use two different resource fetching mechanisms. One is implemented using Expo FileSystem, the other one uses external library. We encourage you to use implementation utilizing Expo if possible.

To use the Expo adapter, please add these libraries:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm install react-native-executorch-expo-resource-fetcher expo-file-system expo-asset
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm add react-native-executorch-expo-resource-fetcher expo-file-system expo-asset
    ```

  </TabItem>
  <TabItem value="yarn" label="yarn">

    ```bash
    yarn add react-native-executorch-expo-resource-fetcher expo-file-system expo-asset
    ```

  </TabItem>
</Tabs>

and then add the following code in your React Native app:

```typescript
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher'; // Use /legacy import if you're using Expo SDK < 54

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});
```

If you cannot use Expo in your project, proceed with the following steps:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm install react-native-executorch-bare-resource-fetcher @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm add react-native-executorch-bare-resource-fetcher @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
    ```

  </TabItem>
  <TabItem value="yarn" label="yarn">

    ```bash
    yarn add react-native-executorch-bare-resource-fetcher @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
    ```

  </TabItem>
</Tabs>

and

```typescript
import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from 'react-native-executorch-bare-resource-fetcher';

initExecutorch({
  resourceFetcher: BareResourceFetcher,
});
```

## Loading

### Load from React Native assets folder (for files < 512MB)

```typescript
useExecutorch({
  modelSource: require('../assets/lfm2_5.pte'),
});
```

### Load from remote URL

For files larger than 512MB or when you want to keep size of the app smaller, you can load the model from a remote URL (e.g. HuggingFace).

```typescript
useExecutorch({
  modelSource: 'https://.../lfm2_5.pte',
});
```

### Load from local file system

If you prefer to delegate the process of obtaining and loading model and tokenizer files to the user, you can use the following method:

```typescript
useExecutorch({
  modelSource: 'file:///var/mobile/.../lfm2_5.pte',
});
```

:::note
The downloaded files are stored in documents directory of your application.
:::

## Predefined Models

Our library offers out-of-the-box support for multiple models. To make things easier, we created aliases for our model exported to `pte` format. For full list of aliases, check out: [API Reference](../06-api-reference/index.md#models---classification)

## Example

The following code snippet demonstrates how to load model and tokenizer files using `useLLM` hook:

```typescript
import { models, useLLM } from 'react-native-executorch';
const llm = useLLM({ model: models.llm.lfm2_5_1_2b_instruct() });
```
