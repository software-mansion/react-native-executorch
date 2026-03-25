# Custom Adapter

If the built-in `BareResourceFetcher` and `ExpoResourceFetcher` don't fit your needs, you can implement your own adapter and plug it into React Native ExecuTorch. This is useful if you want to use a different download library, fetch from a private server, or add custom caching logic.

## The ResourceFetcherAdapter interface[​](#the-resourcefetcheradapter-interface "Direct link to The ResourceFetcherAdapter interface")

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

### `fetch`[​](#fetch "Direct link to fetch")

This is the core method called by every model hook and module whenever it needs to resolve a model or resource to a local file path.

* `callback` — called with a progress value between `0` and `1` as downloads proceed. Called with `1` when complete.

* `...sources` — one or more `ResourceSource` values:

  <!-- -->

  * `string` — a remote URL or an absolute local file path.
  * `number` — a bundled asset reference from `require('./model.pte')`.
  * `object` — an inline JS object (e.g. a tokenizer config) that should be JSON-serialized and written to disk. Your adapter is responsible for stringifying it and saving it as a file, then returning the local path. This allows callers to pass configs inline instead of hosting them at a URL.

* **Returns** an array of absolute local file paths (without `file://` prefix), one per source, in the same order. Return `null` if the fetch was intentionally interrupted (e.g. cancelled by the user).

### `readAsString`[​](#readasstring "Direct link to readasstring")

Called internally to read configuration files (e.g. tokenizer configs) that were previously downloaded via `fetch`.

* `path` — absolute path to the file on disk.
* **Returns** the file contents as a UTF-8 string.

## Registering your adapter[​](#registering-your-adapter "Direct link to Registering your adapter")

Pass your adapter to `initExecutorch` at the entry point of your app, before any other library API is called:

```typescript
import { initExecutorch } from 'react-native-executorch';
import { MyCustomFetcher } from './MyCustomFetcher';

initExecutorch({ resourceFetcher: MyCustomFetcher });

```

Any model hook or module used after this point will route all resource fetching through your adapter.
