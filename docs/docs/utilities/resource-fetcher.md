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

`Promise<string | null>`

- If the fetch was successful, a promise which resolves to a local file path (without file:// prefix) for the stored resource.
- If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns `null`.

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

`Promise<string[] | null>`:

- If the fetch was successful, A promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
- If the fetch was interrupted by `pauseMultipleFetching` or `cancelMultipleFetching`, it returns `null`.

## pauseFetching

Pauses an ongoing download of a file.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';
const localUri = await ResourceFetcher.fetch('https://.../llama3_2.pte');
await ResourceFetcher.pauseFetching('https://.../llama3_2.pte');
// localUri is now null.
```

### Parameters

- `source: ResourceSource` - The resource identifier used when calling `fetch`.

:::info
Pausing/Resuming/Canceling works only for remote URL downloads. If the resource is a local file or embedded asset, fetching cannot be stopped.
:::

### Returns

`Promise<void>` – A promise that resolves when the download is successfully paused.

## resumeFetching

Resumes a paused download of a file.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';
const localUri = await ResourceFetcher.fetch('https://.../llama3_2.pte');
await ResourceFetcher.pauseFetching('https://.../llama3_2.pte');
//  localUri is now  null.
const resolvedUri = await ResourceFetcher.resumeFetching(
  'https://.../llama3_2.pte'
);
// resolvedUri is the local file path to the stored resource.
```

### Parameters

- `source: ResourceSource` - The resource identifier used when calling `fetch` and `pauseFetching`.

### Returns

`Promise<string | null>`

- If the fetch was successful, a promise which resolves to a local file path (without file:// prefix) for the stored resource.
- If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns `null`.

## cancelFetching

Cancels an ongoing/paused download of a file.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';
const localUri = await ResourceFetcher.fetch('https://.../llama3_2.pte');
await ResourceFetcher.cancelFetching('https://.../llama3_2.pte');
//  localUri is now  null.
```

### Parameters

- `source: ResourceSource` - The resource identifier used when calling `fetch`.

### Returns

`Promise<void>` – A promise that resolves when the download is successfully cancelled.

## pauseMultipleFetching

Equivalent of `pauseFetching` for `fetchMultipleResources`. It pauses an ongoing download of multiple resources.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = await ResourceFetcher.fetchMultipleResources(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
await ResourceFetcher.pauseMultipleFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
//now uris is null.
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetchMultipleResources`.

### Returns

`Promise<void>` – A promise that resolves once the download is paused.

## resumeMultipleFetching

Equivalent of `resumeFetching` for `fetchMultipleResources`. It resumes a paused download of multiple resources.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = await ResourceFetcher.fetchMultipleResources(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

await ResourceFetcher.pauseMultipleFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
//now uris is null.

const resolvedUris = await ResourceFetcher.pauseMultipleFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
//now resolvedUris is an array with filepaths to stored resources.
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetchMultipleResources`.

### Returns

`Promise<string[] | null>`:

- If the fetch was successful, A promise which resolves to an array of local file paths for the downloaded resources (without file:// prefix).
- If the fetch was again interrupted by `pauseMultipleFetching` or `cancelMultipleFetching`, it returns null.

## cancelMultipleFetching

Equivalent of `cancelFetching` for `fetchMultipleResources`. It cancels an ongoing/paused download of multiple resources.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = await ResourceFetcher.fetchMultipleResources(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
await ResourceFetcher.cancelMultipleFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
//now uris is null.
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetchMultipleResources`.

### Returns

`Promise<void>` – A promise that resolves once the download is cancelled.

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
