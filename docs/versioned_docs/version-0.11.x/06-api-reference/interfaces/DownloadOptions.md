# Interface: DownloadOptions

Defined in: [fetcher/fetcher.ts:32](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/fetcher/fetcher.ts#L32)

Options controlling a [download](../functions/download.md) call.

## Properties

### forceDownload?

> `optional` **forceDownload**: `boolean`

Defined in: [fetcher/fetcher.ts:45](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/fetcher/fetcher.ts#L45)

Re-downloads every remote source even when it is already cached, replacing
the cached copy. Use to recover from a corrupted file or to pick up a model
that changed behind a stable URL.

---

### onProgress()?

> `optional` **onProgress**: (`progress`) => `void`

Defined in: [fetcher/fetcher.ts:34](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/fetcher/fetcher.ts#L34)

Called with overall progress in `[0, 1]` as bytes arrive.

#### Parameters

##### progress

`number`

#### Returns

`void`

---

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [fetcher/fetcher.ts:39](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/fetcher/fetcher.ts#L39)

Aborts the download. The bytes fetched so far are kept so a later
[download](../functions/download.md) of the same source resumes instead of restarting.
