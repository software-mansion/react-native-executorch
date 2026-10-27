# Function: download()

> **download**\<`T`\>(`source`, `options?`): `Promise`\<`T`\>

Defined in: [fetcher/fetcher.ts:872](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/fetcher/fetcher.ts#L872)

Downloads the remote resources referenced by `source` into a persistent local
cache and resolves with the same value, with every remote URL replaced by the
local path it was downloaded to.

`source` may be a single URL, or any nested structure of plain objects and
arrays — typically a whole model config. Every string leaf that looks like an
`http(s)` URL is downloaded; everything else (local paths, labels, numbers)
is passed through untouched. The result therefore has exactly the same shape
and type as the input and can be handed straight to a `create<Task>` factory:

```ts
const model = await download(models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32);
const { classify, dispose } = await createClassifier(model);
```

Downloads go to a persistent cache. When a config references several files,
overall progress is weighted by their byte sizes so a large model isn't
reported the same as a tiny tokenizer.

Install
[`@kesha-antonov/react-native-background-downloader`](https://github.com/kesha-antonov/react-native-background-downloader)
(`>=4.4.0`) to have transfers keep running while the app is in the background,
and survive it being killed. The fetcher uses it automatically on both platforms
when it is present, so the behavior is the same on each; nothing else changes.

Without it the fetcher falls back to what each platform can do on its own: the
system DownloadManager on Android, which still continues in the background,
and on iOS a streaming request that stops when the app is suspended and is
resumed by the next `download` call.

## Type Parameters

### T

`T`

The shape of the value being resolved.

## Parameters

### source

`T`

A URL, a local path, or any nested object/array holding them.

### options?

[`DownloadOptions`](../interfaces/DownloadOptions.md) = `{}`

Progress and cancellation options.

## Returns

`Promise`\<`T`\>

`source` with every remote URL replaced by its local file path.
