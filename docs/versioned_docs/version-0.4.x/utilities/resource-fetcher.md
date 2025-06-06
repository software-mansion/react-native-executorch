---
title: Resource Fetcher
---

This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory. These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.

## fetch

Fetches a single resource (remote URL, local file or embedded asset), downloads or stores it locally for use by React Native ExecuTorch.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const localUri = await ResourceFetcher.fetch('https://.../llama3_2.pte');
```

With download progress:

```typescript
const localUri = await ResourceFetcher.fetch(
  'https://.../llama3_2.pte',
  (progress) => {
    console.log('Download progress:', progress);
  }
);
```

### Parameters

- `source: ResourceSource` - A remote string URI, local file URI, require()-based asset.
- `callback?: (downloadProgress: number) => void` - Optional callback that reports download progress between 0 and 1.

### Returns

`Promise<string>` – A promise which resolves to a local file path (without file:// prefix) for the stored resource.

:::info
If the resource is an object, it will be saved as a JSON file on disk.  
:::

## fetchMultipleResources

Fetches multiple resources and combines individual download progress into a single callback.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = await ResourceFetcher.fetchMultipleResources(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `callback?: (downloadProgress: number) => void` - Optional callback to track progress of all downloads, reported between 0 and 1.
- `...sources: ResourceSource[]` - Multiple resources that can be strings, asset references, or objects.

### Returns

`Promise<string[]>` – A promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).

## deleteMultipleResources

Deletes downloaded resources from the local filesystem.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

await ResourceFetcher.deleteMultipleResources('https://.../llama3_2.pte');
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<void>` – A promise that resolves once all specified resources have been removed.

## listDownloadedFiles

Lists all the downloaded files used by React Native ExecuTorch.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const filesUris = await ResourceFetcher.listDownloadedFiles();
```

### Returns

`Promise<string[]>` - A promise, which resolves to an array of URIs for all the downloaded files.

## listDownloadedModels

Lists all the downloaded models used by React Native ExecuTorch.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const modelsUris = await ResourceFetcher.listDownloadedModels();
```

### Returns

`Promise<string[]>` - A promise, which resolves to an array of URIs for all the downloaded models.
