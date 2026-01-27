# Resource Fetcher

This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory. These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.

## fetch[​](#fetch "Direct link to fetch")

Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.

### Reference[​](#reference "Direct link to Reference")

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const uris = await ResourceFetcher.fetch(
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

* If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
* If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

If the resource is an object, it will be saved as a JSON file on disk.

## pauseFetching[​](#pausefetching "Direct link to pauseFetching")

Pauses an ongoing download of files.

### Reference[​](#reference-1 "Direct link to Reference")

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

### Parameters[​](#parameters-1 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns[​](#returns-1 "Direct link to Returns")

`Promise<void>` – A promise that resolves once the download is paused.

## resumeFetching[​](#resumefetching "Direct link to resumeFetching")

Resumes a paused download of files.

### Reference[​](#reference-2 "Direct link to Reference")

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

### Parameters[​](#parameters-2 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns[​](#returns-2 "Direct link to Returns")

`Promise<string[] | null>`:

* If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without file:// prefix).
* If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to null.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

The other way to resume paused resources is to simply call `fetch` again. However, `resumeFetching` is faster.

## cancelFetching[​](#cancelfetching "Direct link to cancelFetching")

Cancels an ongoing/paused download of files.

### Reference[​](#reference-3 "Direct link to Reference")

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

### Parameters[​](#parameters-3 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch()`.

### Returns[​](#returns-3 "Direct link to Returns")

`Promise<void>` – A promise that resolves once the download is cancelled.

## deleteResources[​](#deleteresources "Direct link to deleteResources")

Deletes downloaded resources from the local filesystem.

### Reference[​](#reference-4 "Direct link to Reference")

```typescript
import { ResourceFetcher } from 'react-native-executorch';

await ResourceFetcher.deleteResources('https://.../llama3_2.pte');

```

### Parameters[​](#parameters-4 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers used when calling `fetch`.

### Returns[​](#returns-4 "Direct link to Returns")

`Promise<void>` – A promise that resolves once all specified resources have been removed.

## getFilesTotalSize[​](#getfilestotalsize "Direct link to getFilesTotalSize")

Fetches the info about files size. Works only for remote files.

### Reference[​](#reference-5 "Direct link to Reference")

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const totalSize = await ResourceFetcher.getFilesTotalSize(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

```

### Parameters[​](#parameters-5 "Direct link to Parameters")

* `...sources: ResourceSource[]` - The resource identifiers (URLs).

### Returns[​](#returns-5 "Direct link to Returns")

`Promise<number>` – A promise that resolves to combined size of files in bytes.

## listDownloadedFiles[​](#listdownloadedfiles "Direct link to listDownloadedFiles")

Lists all the downloaded files used by React Native ExecuTorch.

### Reference[​](#reference-6 "Direct link to Reference")

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const filesUris = await ResourceFetcher.listDownloadedFiles();

```

### Returns[​](#returns-6 "Direct link to Returns")

`Promise<string[]>` - A promise, which resolves to an array of URIs for all the downloaded files.

## listDownloadedModels[​](#listdownloadedmodels "Direct link to listDownloadedModels")

Lists all the downloaded models used by React Native ExecuTorch.

### Reference[​](#reference-7 "Direct link to Reference")

```typescript
import { ResourceFetcher } from 'react-native-executorch';

const modelsUris = await ResourceFetcher.listDownloadedModels();

```

### Returns[​](#returns-7 "Direct link to Returns")

`Promise<string[]>` - A promise, which resolves to an array of URIs for all the downloaded models.
