---
title: Usage
---

This page documents the resource fetcher APIs exposed by `react-native-executorch-expo-resource-fetcher` and `react-native-executorch-bare-resource-fetcher`. These adapters handle downloading and managing model files on disk.

:::info
All examples below use `ExpoResourceFetcher`. If you're on bare React Native, replace the import with:

```typescript
import { BareResourceFetcher } from 'react-native-executorch-bare-resource-fetcher';
```

The public API is identical between both adapters.
:::

## fetch

Fetches resources (remote URLs, local files, or embedded assets) and stores them locally for use by React Native ExecuTorch.

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = await ExpoResourceFetcher.fetch(
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

- If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without `file://` prefix).
- If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

:::info
If the resource is an object, it will be saved as a JSON file on disk.
:::

## pauseFetching

Pauses an ongoing download.

:::info
Bare Resource Fetcher doesn't support this feature on Android.
:::

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = ExpoResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved to: ', uris); // null, since we paused
});

await ExpoResourceFetcher.pauseFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<void>` – A promise that resolves once the download is paused.

## resumeFetching

:::info
Bare Resource Fetcher doesn't support this feature on Android.
:::

Resumes a paused download.

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = ExpoResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved as: ', uris); // null, since we paused
});

await ExpoResourceFetcher.pauseFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

const resolvedUris = await ExpoResourceFetcher.resumeFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
// resolvedUris resolves to file paths, unless paused/cancelled again
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<string[] | null>`:

- If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without `file://` prefix).
- If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

:::info
You can also resume a paused download by calling `fetch` again with the same sources. However, `resumeFetching` is faster as it resumes from where it left off.
:::

## cancelFetching

Cancels an ongoing or paused download.

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = ExpoResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved as: ', uris); // null, since we cancelled
});

await ExpoResourceFetcher.cancelFetching(
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
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

await ExpoResourceFetcher.deleteResources('https://.../llama3_2.pte');
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns

`Promise<void>` – A promise that resolves once all specified resources have been removed.

## getFilesTotalSize

Fetches the combined size of remote files. Works only for remote URLs.

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const totalSize = await ExpoResourceFetcher.getFilesTotalSize(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

### Parameters

- `...sources: ResourceSource[]` - The resource identifiers (URLs).

### Returns

`Promise<number>` – A promise that resolves to the combined size of files in bytes.

## listDownloadedFiles

Lists all files downloaded by React Native ExecuTorch.

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const filesUris = await ExpoResourceFetcher.listDownloadedFiles();
```

### Returns

`Promise<string[]>` - A promise that resolves to an array of URIs for all downloaded files.

## listDownloadedModels

Lists all downloaded model files (`.pte`).

### Reference

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const modelsUris = await ExpoResourceFetcher.listDownloadedModels();
```

### Returns

`Promise<string[]>` - A promise that resolves to an array of URIs for all downloaded model files.
