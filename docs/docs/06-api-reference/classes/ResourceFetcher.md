# Class: ResourceFetcher

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:63](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L63)

This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory.
These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.

## Constructors

### Constructor

> **new ResourceFetcher**(): `ResourceFetcher`

#### Returns

`ResourceFetcher`

## Properties

### downloads

> `static` **downloads**: `Map`\<[`ResourceSource`](../type-aliases/ResourceSource.md), `DownloadResource`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:64](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L64)

## Methods

### cancelFetching()

> `static` **cancelFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:284](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L284)

Cancels an ongoing/paused download of files.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

The resource identifiers used when calling `fetch()`.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the download is canceled.

***

### deleteResources()

> `static` **deleteResources**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:327](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L327)

Deletes downloaded resources from the local filesystem.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

The resource identifiers used when calling `fetch`.

#### Returns

`Promise`\<`void`\>

A promise that resolves once all specified resources have been removed.

***

### fetch()

> `static` **fetch**(`callback`, ...`sources`): `Promise`\<`string`[] \| `null`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:74](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L74)

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
If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.

***

### getFilesTotalSize()

> `static` **getFilesTotalSize**(...`sources`): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:345](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L345)

Fetches the info about files size. Works only for remote files.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

The resource identifiers (URLs).

#### Returns

`Promise`\<`number`\>

A promise that resolves to combined size of files in bytes.

***

### listDownloadedFiles()

> `static` **listDownloadedFiles**(): `Promise`\<`string`[]\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:306](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L306)

Lists all the downloaded files used by React Native ExecuTorch.

#### Returns

`Promise`\<`string`[]\>

A promise, which resolves to an array of URIs for all the downloaded files.

***

### listDownloadedModels()

> `static` **listDownloadedModels**(): `Promise`\<`string`[]\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:316](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L316)

Lists all the downloaded models used by React Native ExecuTorch.

#### Returns

`Promise`\<`string`[]\>

A promise, which resolves to an array of URIs for all the downloaded models.

***

### pauseFetching()

> `static` **pauseFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:261](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L261)

Pauses an ongoing download of files.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

The resource identifiers used when calling `fetch`.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the download is paused.

***

### resumeFetching()

> `static` **resumeFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:273](https://github.com/software-mansion/react-native-executorch/blob/ec5f7c776ad985c8e6b0d570ee5098364e0b2ceb/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L273)

Resumes a paused download of files.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

The resource identifiers used when calling fetch.

#### Returns

`Promise`\<`void`\>

If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without file:// prefix).
If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.
