# Interface: ResourceFetcherAdapter

Defined in: [utils/ResourceFetcher.ts:47](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L47)

Adapter interface for resource fetching operations.
**Required Methods:**
- `fetch`: Download resources to local storage (used by all modules)
- `readAsString`: Read file contents as string (used for config files)

## Remarks

This interface is intentionally minimal. Custom fetchers only need to implement
these two methods for the library to function correctly.

## Methods

### fetch()

> **fetch**(`callback`, ...`sources`): `Promise`\<`string`[] \| `null`\>

Defined in: [utils/ResourceFetcher.ts:57](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L57)

Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.

#### Parameters

##### callback

(`downloadProgress`) => `void`

Optional callback to track progress of all downloads, reported between 0 and 1.

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

Multiple resources that can be strings, asset references, or objects.

#### Returns

`Promise`\<`string`[] \| `null`\>

If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
If the fetch was interrupted, it returns a promise which resolves to `null`.

#### Remarks

**REQUIRED**: Used by all library modules for downloading models and resources.

***

### readAsString()

> **readAsString**(`path`): `Promise`\<`string`\>

Defined in: [utils/ResourceFetcher.ts:69](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L69)

Read file contents as a string.

#### Parameters

##### path

`string`

Absolute file path

#### Returns

`Promise`\<`string`\>

File contents as string

#### Remarks

**REQUIRED**: Used internally for reading configuration files (e.g., tokenizer configs).
