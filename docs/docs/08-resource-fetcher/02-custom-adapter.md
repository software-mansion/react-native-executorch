---
title: Custom Adapter
---

If the built-in `BareResourceFetcher` and `ExpoResourceFetcher` don't fit your needs, for example, you want to use a different download library, or fetch from a private server you can implement your own adapter and plug it into React Native ExecuTorch.

## The ResourceFetcherAdapter interface

Your adapter must implement the `ResourceFetcherAdapter` interface exported from `react-native-executorch`. This interface defines every method which is used under the hood by React Native ExecuTorch:

```typescript
import {
  ResourceFetcherAdapter,
  ResourceSource,
} from 'react-native-executorch';

interface ResourceFetcherAdapter {
  fetch(
    callback: (downloadProgress: number) => void,
    ...sources: ResourceSource[]
  ): Promise<string[] | null>;

  readAsString(path: string): Promise<string>;
}
```

### `fetch`

This is the core method called by every model hook and module whenever it needs to resolve a model or resource to a local file path.

- `callback` — called with a progress value between `0` and `1` as downloads proceed. Called with `1` when complete.
- `...sources` — one or more `ResourceSource` values:
  - `string` — a remote URL or an absolute local file path.
  - `number` — a bundled asset reference from `require('./model.pte')`.
  - `object` — an inline JS object (e.g. a tokenizer config) that should be JSON-serialized and written to disk. Your adapter is responsible for stringifying it and saving it as a file, then returning the local path. This allows callers to pass configs inline instead of hosting them at a URL.
- **Returns** an array of absolute local file paths (without `file://` prefix), one per source, in the same order. Return `null` if the fetch was intentionally interrupted (e.g. cancelled by the user).

### `readAsString`

Called internally to read configuration files (e.g. tokenizer configs) that were previously downloaded via `fetch`.

- `path` — absolute path to the file on disk.
- **Returns** the file contents as a UTF-8 string.

## Example

Here's a minimal custom adapter that downloads files using the browser `fetch` API (useful for testing or web targets):

```typescript
import * as FileSystem from 'expo-file-system';
import {
  ResourceFetcherAdapter,
  ResourceSource,
} from 'react-native-executorch';

export const MyCustomFetcher: ResourceFetcherAdapter = {
  async fetch(callback, ...sources: ResourceSource[]) {
    const paths: string[] = [];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (typeof source !== 'string') {
        throw new Error('MyCustomFetcher only supports string URLs');
      }

      const filename = source.split('/').pop()!;
      const localUri = FileSystem.documentDirectory + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        source,
        localUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          const fileProgress = totalBytesWritten / totalBytesExpectedToWrite;
          const overallProgress = (i + fileProgress) / sources.length;
          callback(overallProgress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) return null;

      paths.push(result.uri.replace('file://', ''));
    }

    callback(1);
    return paths;
  },

  async readAsString(path: string) {
    return await FileSystem.readAsStringAsync('file://' + path, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  },
};
```

## Registering your adapter

Pass your adapter to `initExecutorch` at the entry point of your app, before any other library API is called:

```typescript
import { initExecutorch } from 'react-native-executorch';
import { MyCustomFetcher } from './MyCustomFetcher';

initExecutorch({ resourceFetcher: MyCustomFetcher });
```

Any model hook or module used after this point will route all resource fetching through your adapter.
