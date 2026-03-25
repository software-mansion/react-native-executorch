# Usage

This page documents the resource fetcher APIs exposed by `react-native-executorch-expo-resource-fetcher` and `react-native-executorch-bare-resource-fetcher`. These adapters handle downloading and managing model files on disk.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

All examples below use `ExpoResourceFetcher`. If you're on bare React Native, replace the import with:

```typescript
import { BareResourceFetcher } from 'react-native-executorch-bare-resource-fetcher';

```

The public API is identical between both adapters.

## fetch[​](#fetch "Direct link to fetch")

Fetches resources (remote URLs, local files, or embedded assets) and stores them locally for use by React Native ExecuTorch.

### Reference[​](#reference "Direct link to Reference")

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = await ExpoResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

```

### Parameters[​](#parameters "Direct link to Parameters")

* `callback: (downloadProgress: number) => void` - Optional callback to track progress of all downloads, reported between 0 and 1.
* `...sources: ResourceSource[]` - Multiple resources that can be strings, asset references, or objects.

### Returns[​](#returns "Direct link to Returns")

`Promise<string[] | null>`:

* If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without `file://` prefix).
* If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

If the resource is an object, it will be saved as a JSON file on disk.

## pauseFetching[​](#pausefetching "Direct link to pauseFetching")

Pauses an ongoing download.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Bare Resource Fetcher doesn't support this feature on Android.

### Reference[​](#reference-1 "Direct link to Reference")

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

### Parameters[​](#parameters-1 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns[​](#returns-1 "Direct link to Returns")

`Promise<void>` – A promise that resolves once the download is paused.

## resumeFetching[​](#resumefetching "Direct link to resumeFetching")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Bare Resource Fetcher doesn't support this feature on Android.

Resumes a paused download.

### Reference[​](#reference-2 "Direct link to Reference")

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

### Parameters[​](#parameters-2 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns[​](#returns-2 "Direct link to Returns")

`Promise<string[] | null>`:

* If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without `file://` prefix).
* If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

You can also resume a paused download by calling `fetch` again with the same sources. However, `resumeFetching` is faster as it resumes from where it left off.

## cancelFetching[​](#cancelfetching "Direct link to cancelFetching")

Cancels an ongoing or paused download.

### Reference[​](#reference-3 "Direct link to Reference")

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

### Parameters[​](#parameters-3 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch()`.

### Returns[​](#returns-3 "Direct link to Returns")

`Promise<void>` – A promise that resolves once the download is cancelled.

## deleteResources[​](#deleteresources "Direct link to deleteResources")

Deletes downloaded resources from the local filesystem.

### Reference[​](#reference-4 "Direct link to Reference")

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

await ExpoResourceFetcher.deleteResources('https://.../llama3_2.pte');

```

### Parameters[​](#parameters-4 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns[​](#returns-4 "Direct link to Returns")

`Promise<void>` – A promise that resolves once all specified resources have been removed.

## getFilesTotalSize[​](#getfilestotalsize "Direct link to getFilesTotalSize")

Fetches the combined size of remote files. Works only for remote URLs.

### Reference[​](#reference-5 "Direct link to Reference")

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const totalSize = await ExpoResourceFetcher.getFilesTotalSize(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

```

### Parameters[​](#parameters-5 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers (URLs).

### Returns[​](#returns-5 "Direct link to Returns")

`Promise<number>` – A promise that resolves to the combined size of files in bytes.

## listDownloadedFiles[​](#listdownloadedfiles "Direct link to listDownloadedFiles")

Lists all files downloaded by React Native ExecuTorch.

### Reference[​](#reference-6 "Direct link to Reference")

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const filesUris = await ExpoResourceFetcher.listDownloadedFiles();

```

### Returns[​](#returns-6 "Direct link to Returns")

`Promise<string[]>` - A promise that resolves to an array of URIs for all downloaded files.

## listDownloadedModels[​](#listdownloadedmodels "Direct link to listDownloadedModels")

Lists all downloaded model files (`.pte`).

### Reference[​](#reference-7 "Direct link to Reference")

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const modelsUris = await ExpoResourceFetcher.listDownloadedModels();

```

### Returns[​](#returns-7 "Direct link to Returns")

`Promise<string[]>` - A promise that resolves to an array of URIs for all downloaded model files.
