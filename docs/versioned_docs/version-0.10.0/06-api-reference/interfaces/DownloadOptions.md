# Interface: DownloadOptions

Defined in: [fetcher/fetcher.ts:29](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/fetcher/fetcher.ts#L29)

Options controlling a [download](../functions/download.md) call.

## Properties

### forceDownload?

> `optional` **forceDownload**: `boolean`

Defined in: [fetcher/fetcher.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/fetcher/fetcher.ts#L44)

Re-downloads every remote source even when it is already cached, replacing
the cached copy. Use to recover from a corrupted file or to pick up a model
that changed behind a stable URL.

---

### onProgress()?

> `optional` **onProgress**: (`progress`) => `void`

Defined in: [fetcher/fetcher.ts:31](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/fetcher/fetcher.ts#L31)

Called with overall progress in `[0, 1]` as bytes arrive.

#### Parameters

##### progress

`number`

#### Returns

`void`

---

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [fetcher/fetcher.ts:38](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/fetcher/fetcher.ts#L38)

Aborts the download. The bytes fetched so far are kept so a later
[download](../functions/download.md) of the same source resumes instead of restarting, except on
Android without the optional background downloader, where the system
DownloadManager discards a cancelled transfer.
