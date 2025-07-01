---
title: Resource Fetcher
---

This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory. These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.

## fetch

Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = await ResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `callback: (downloadProgress: number) => void` - Optional callback to track progress of all downloads, reported between 0 and 1.
- `...sources: ResourceSource[]` - Multiple resources that can be strings, asset references, or objects.

### Returns

`Promise<string[] | null>`:

- If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
- If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

:::info
If the resource is an object, it will be saved as a JSON file on disk.  
:::

## pauseFetching

Pauses an ongoing download of files.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = ResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved to: ', uris); // since we pause the fetch, uris is resolved to null
});

await ResourceFetcher.pauseFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<void>` – A promise that resolves once the download is paused.

## resumeFetching

Resumes a paused download of files.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = ResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved as: ', uris); // since we pause the fetch, uris is resolved to null
});

await ResourceFetcher.pauseFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

const resolvedUris = await ResourceFetcher.resumeFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
//resolvedUris is resolved to file paths to fetched resources, unless explicitly paused/cancel again.
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<string[] | null>`:

- If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without file:// prefix).
- If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to null.

:::info
The other way to resume paused resources is to simply call `fetch` again. However, `resumeFetching` is faster.
:::

## cancelFetching

Cancels an ongoing/paused download of files.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = ResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved as: ', uris); // since we cancel the fetch, uris is resolved to null
});

await ResourceFetcher.cancelFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch()`.

### Returns

`Promise<void>` – A promise that resolves once the download is cancelled.

## deleteResources

Deletes downloaded resources from the local filesystem.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

await ResourceFetcher.deleteResources('https://.../llama3_2.pte');
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<void>` – A promise that resolves once all specified resources have been removed.

## getFilesTotalSize

Fetches the info about files size. Works only for remote files.

### Reference

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const totalSize = await ResourceFetcher.getFilesTotalSize(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers (URLs).

### Returns

`Promise<number>` – A promise that resolves to combined size of files in bytes.

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
