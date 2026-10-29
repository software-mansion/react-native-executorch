# Abstract Class: BaseResourceFetcherClass\<TDownload\>

Defined in: [utils/BaseResourceFetcherClass.ts:27](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L27)

Abstract base class for resource fetcher implementations.

Contains the shared fetch loop, source dispatching, and pause/resume/cancel
plumbing. Concrete subclasses (expo, bare) implement the platform-specific
file system operations and download mechanics.

## Type Parameters

### TDownload

`TDownload`

The platform-specific active download descriptor type.

## Implements

- [`ResourceFetcherAdapter`](../interfaces/ResourceFetcherAdapter.md)

## Constructors

### Constructor

> **new BaseResourceFetcherClass**\<`TDownload`\>(): `BaseResourceFetcherClass`\<`TDownload`\>

#### Returns

`BaseResourceFetcherClass`\<`TDownload`\>

## Properties

### downloads

> `abstract` `protected` **downloads**: `Map`\<[`ResourceSource`](../type-aliases/ResourceSource.md), `TDownload`\>

Defined in: [utils/BaseResourceFetcherClass.ts:37](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L37)

Map of currently active (downloading or paused) remote downloads.
Keyed by the original source value the user passed in so that
`pauseFetching`/`cancelFetching` can look up the entry using that same value.
Entries are added when a download starts and removed when it completes,
is canceled, or errors.

## Methods

### cancel()

> `abstract` `protected` **cancel**(`source`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:124](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L124)

Cancel an active or paused download for `source`. Must:

1. Abort the in-progress network request.
2. Clean up any partial files from the cache directory.
3. Delete the entry from `downloads`.
4. Call `reject(new RnExecutorchError(DownloadInterrupted, ...))` on the entry to unblock the `fetch()` loop.

#### Parameters

##### source

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### Returns

`Promise`\<`void`\>

---

### cancelFetching()

> **cancelFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:217](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L217)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>

---

### deleteResources()

> `abstract` **deleteResources**(...`sources`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:142](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L142)

Delete the local files corresponding to the given sources from
`RNEDirectory`. Should be a no-op for sources whose file does not exist.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>

---

### fetch()

> **fetch**(`callback?`, ...`sources`): `Promise`\<\{ `paths`: `string`[]; `wasDownloaded`: `boolean`[]; \}\>

Defined in: [utils/BaseResourceFetcherClass.ts:150](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L150)

Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.

#### Parameters

##### callback?

(`downloadProgress`) => `void`

Optional callback to track progress of all downloads, reported between 0 and 1.

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

Multiple resources that can be strings, asset references, or objects.

#### Returns

`Promise`\<\{ `paths`: `string`[]; `wasDownloaded`: `boolean`[]; \}\>

If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
If the fetch was interrupted, it returns a promise which resolves to `null`.

#### Remarks

**REQUIRED**: Used by all library modules for downloading models and resources.

#### Implementation of

[`ResourceFetcherAdapter`](../interfaces/ResourceFetcherAdapter.md).[`fetch`](../interfaces/ResourceFetcherAdapter.md#fetch)

---

### findActive()

> `protected` **findActive**(`sources`): [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [utils/BaseResourceFetcherClass.ts:221](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L221)

#### Parameters

##### sources

[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

[`ResourceSource`](../type-aliases/ResourceSource.md)

---

### getFilesSizes()

> `abstract` `protected` **getFilesSizes**(`sources`): `Promise`\<`FilesSizesResult`\>

Defined in: [utils/BaseResourceFetcherClass.ts:45](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L45)

Fire HEAD requests for all remote sources to collect their file sizes.
Used by `fetch()` to calculate unified 0→1 progress across all downloads.
Non-remote sources (objects, local files, assets) should be included in
the results with `length: 0`.

#### Parameters

##### sources

[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`FilesSizesResult`\>

---

### getFilesTotalSize()

> `abstract` **getFilesTotalSize**(...`sources`): `Promise`\<`number`\>

Defined in: [utils/BaseResourceFetcherClass.ts:148](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L148)

Fire HEAD requests for the given remote URLs and return their combined
size in bytes. Non-remote sources should contribute 0 bytes.

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`number`\>

---

### handleAsset()

> `abstract` `protected` **handleAsset**(`source`, `progressCallback`): `Promise`\<`string`\>

Defined in: [utils/BaseResourceFetcherClass.ts:70](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L70)

Handle a bundled asset (a `require()` number).

- **Dev mode** (Metro serves the asset over HTTP): resolve the URI and
  delegate to `handleRemote`.
- **Release mode** (asset is bundled locally): copy it to `RNEDirectory`
  and return the local path.
  Must be idempotent — if the destination file already exists, skip the copy.

#### Parameters

##### source

`number`

##### progressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`string`\>

---

### handleLocalFile()

> `abstract` `protected` **handleLocalFile**(`source`): `string`

Defined in: [utils/BaseResourceFetcherClass.ts:60](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L60)

Strip the `file://` prefix from a local file URI and return the bare path.
No I/O required — this is a pure string transformation.

#### Parameters

##### source

`string`

#### Returns

`string`

---

### handleObject()

> `abstract` `protected` **handleObject**(`source`): `Promise`\<`string`\>

Defined in: [utils/BaseResourceFetcherClass.ts:54](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L54)

Serialize `source` as JSON, write it to `RNEDirectory`, and return the
local path. Should be idempotent — if the file already exists, return its
path without rewriting.

#### Parameters

##### source

`object`

#### Returns

`Promise`\<`string`\>

---

### handleRemote()

> `abstract` `protected` **handleRemote**(`uri`, `source`, `progressCallback`): `Promise`\<\{ `path`: `string`; `wasDownloaded`: `boolean`; \}\>

Defined in: [utils/BaseResourceFetcherClass.ts:93](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L93)

Download a remote file to `RNEDirectory` and return the local path.
Must be idempotent — if the file is already present, return its path
without re-downloading.

`uri` and `source` are separate parameters because for asset dev-mode
sources, `source` is the `require()` number the user holds (used as the
`downloads` map key for pause/cancel), while `uri` is the resolved HTTP
URL needed for the actual network request. For plain remote strings they
are the same value.

Returns `null` if the download was interrupted by `cancel()`.

#### Parameters

##### uri

`string`

##### source

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### progressCallback

(`progress`) => `void`

#### Returns

`Promise`\<\{ `path`: `string`; `wasDownloaded`: `boolean`; \}\>

#### Remarks

The returned Promise must be resolvable from outside this function —
`cancel()` and `resume()` need to unblock the `fetch()` loop by calling
`resolve`/`reject` stored on the `downloads` map entry. See handlers.ts
for the leaked-resolver pattern used to achieve this.

---

### listDownloadedFiles()

> `abstract` **listDownloadedFiles**(): `Promise`\<`string`[]\>

Defined in: [utils/BaseResourceFetcherClass.ts:136](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L136)

List all files previously downloaded into `RNEDirectory`.
Returns absolute file paths (no `file://` prefix).

#### Returns

`Promise`\<`string`[]\>

---

### listDownloadedModels()

> **listDownloadedModels**(): `Promise`\<`string`[]\>

Defined in: [utils/BaseResourceFetcherClass.ts:204](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L204)

#### Returns

`Promise`\<`string`[]\>

---

### pause()

> `abstract` `protected` **pause**(`source`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:105](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L105)

Pause the active download for `source`. Should throw
`ResourceFetcherAlreadyPaused` if already paused, and
`ResourceFetcherPlatformNotSupported` if the platform does not support
pausing (e.g. Android in the bare implementation).

#### Parameters

##### source

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### Returns

`Promise`\<`void`\>

---

### pauseFetching()

> **pauseFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:209](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L209)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>

---

### readAsString()

> `abstract` **readAsString**(`path`): `Promise`\<`string`\>

Defined in: [utils/BaseResourceFetcherClass.ts:130](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L130)

Read a local file and return its contents as a UTF-8 string.
Used internally to read config files (e.g. tokenizer JSON).

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`ResourceFetcherAdapter`](../interfaces/ResourceFetcherAdapter.md).[`readAsString`](../interfaces/ResourceFetcherAdapter.md#readasstring)

---

### resume()

> `abstract` `protected` **resume**(`source`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:115](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L115)

Resume a paused download for `source`. The result must flow back through
the original `fetch()` promise — call `resolve(path)` on the `downloads`
map entry rather than creating a new Promise. Should throw
`ResourceFetcherAlreadyOngoing` if the download is not paused, and
`ResourceFetcherPlatformNotSupported` if the platform does not support
resuming.

#### Parameters

##### source

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### Returns

`Promise`\<`void`\>

---

### resumeFetching()

> **resumeFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [utils/BaseResourceFetcherClass.ts:213](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/BaseResourceFetcherClass.ts#L213)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>
