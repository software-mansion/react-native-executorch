# Interface: ResourceFetcherAdapter

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:17](https://github.com/software-mansion/react-native-executorch/blob/9db6e3b8b0f1b11ef66f7c45d29a251b31e9c252/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L17)

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

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:29](https://github.com/software-mansion/react-native-executorch/blob/9db6e3b8b0f1b11ef66f7c45d29a251b31e9c252/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L29)

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

---

### readAsString()

> **readAsString**(`path`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:43](https://github.com/software-mansion/react-native-executorch/blob/9db6e3b8b0f1b11ef66f7c45d29a251b31e9c252/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L43)

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
