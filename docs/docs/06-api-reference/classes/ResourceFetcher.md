# Class: ResourceFetcher

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L53)

This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory.
These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.

## Constructors

### Constructor

> **new ResourceFetcher**(): `ResourceFetcher`

#### Returns

`ResourceFetcher`

## Properties

### fs

> `static` **fs**: `object`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:128](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L128)

Filesystem utilities for reading downloaded resources.

#### readAsString()

> **readAsString**: (`path`) => `Promise`\<`string`\>

Reads the contents of a file as a string.

##### Parameters

###### path

`string`

Absolute file path to read.

##### Returns

`Promise`\<`string`\>

A promise that resolves to the file contents as a string.

##### Remarks

**REQUIRED**: Used internally for reading configuration files (e.g., tokenizer configs).

#### Remarks

Provides access to filesystem operations through the configured adapter.
Currently supports reading file contents as strings for configuration files.

## Methods

### fetch()

> `static` **fetch**(`callback`, ...`sources`): `Promise`\<`string`[] \| `null`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:105](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L105)

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

---

### getAdapter()

> `static` **getAdapter**(): [`ResourceFetcherAdapter`](../interfaces/ResourceFetcherAdapter.md)

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:87](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L87)

Gets the current resource fetcher adapter instance.

#### Returns

[`ResourceFetcherAdapter`](../interfaces/ResourceFetcherAdapter.md)

The configured ResourceFetcherAdapter instance.

#### Throws

If no adapter has been set via [setAdapter](#setadapter).

#### Remarks

**INTERNAL**: Used internally by all resource fetching operations.

---

### resetAdapter()

> `static` **resetAdapter**(): `void`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:74](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L74)

Resets the resource fetcher adapter to null.

#### Returns

`void`

#### Remarks

**INTERNAL**: Used primarily for testing purposes to clear the adapter state.

---

### setAdapter()

> `static` **setAdapter**(`adapter`): `void`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:64](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L64)

Sets a custom resource fetcher adapter for resource operations.

#### Parameters

##### adapter

[`ResourceFetcherAdapter`](../interfaces/ResourceFetcherAdapter.md)

The adapter instance to use for fetching resources.

#### Returns

`void`

#### Remarks

**INTERNAL**: Used by platform-specific init functions (expo/bare) to inject their fetcher implementation.
