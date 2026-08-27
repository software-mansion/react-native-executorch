---
title: Downloading Models
slug: /fundamentals/downloading-models
description: 'How model files reach the device — the pre-exported model registry, automatic download and caching in hooks, and the imperative download API with progress and cancellation.'
keywords:
  [
    react native executorch,
    download model,
    model cache,
    useResourceDownload,
    download,
    on-device ai,
    pte,
  ]
---

# Downloading Models

A model is one or more files — the `.pte` program, and often a tokenizer,
phonemizer, or label map alongside it — that have to be present on the device
before inference can run. React Native ExecuTorch downloads those files for you
and caches them persistently, so in most apps you never touch the filesystem
directly: you point a pipeline at a model and the library fetches whatever isn't
already cached.

## Where models come from

A model source is either remote or local:

- **Pre-exported models** live in our
  [HuggingFace collection](https://huggingface.co/software-mansion/collections) and
  are addressed through the
  [`models`](../06-api-reference/variables/models.md) registry. Each entry bundles
  every file a pipeline needs behind one object — for example
  `models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32` resolves to the model and
  its label assets. This registry is the single source of truth for the tuned,
  ready-to-run models.
- **Your own models** are plain URLs or local paths — a file bundled with the app,
  a `file://` path, or a URL on your own host — as long as the model's schema
  matches the pipeline (see
  [Exporting Custom Models](../03-core-and-advanced/07-exporting-custom-models.md)).

Local paths are always passed through untouched; only `http(s)` URLs are ever
downloaded.

## Automatic downloading with hooks

The `use<Task>` hooks and the
[`useResourceDownload`](../06-api-reference/functions/useResourceDownload.md) hook
download and cache a model's files automatically. Pass a config; the hook fetches
anything not already cached, reports progress, and hands back the same config with
every URL replaced by its local path.

```typescript
import { useResourceDownload, models } from 'react-native-executorch';

function Example() {
  const { resource, downloadProgress, downloadError } = useResourceDownload(
    models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32
  );

  // resource is undefined until the download resolves, then mirrors the config
  // with local file paths, ready to hand to a pipeline.
}
```

Both hooks accept
[`ResourceOptions`](../06-api-reference/type-aliases/ResourceOptions.md):

- **`preventLoad`** — skip the download entirely (and reset state), for deferring a
  fetch until the user opts in.
- **`forceDownload`** — re-fetch even when cached, to replace a corrupted file or
  pick up a model that changed behind a stable URL.

## Imperative downloading

When you're not in a component — a background task, a custom pipeline, a
preloading step — use the imperative
[`download`](../06-api-reference/functions/download.md) function. It takes a URL,
or any nested object/array of them (typically a whole model config), downloads
every remote leaf, and resolves with the same value with URLs replaced by local
paths — ready to pass straight to a `create<Task>` factory:

```typescript
import { download, models } from 'react-native-executorch';

const model = await download(models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32, {
  onProgress: (p) => console.log(`${Math.round(p * 100)}%`),
});

// `model` now holds local paths; hand it to a pipeline factory
```

[`DownloadOptions`](../06-api-reference/interfaces/DownloadOptions.md) covers the
common needs:

- **`onProgress(p)`** — overall progress in `[0, 1]`, weighted by each file's byte
  size so a large model isn't reported the same as a small tokenizer.
- **`signal`** — an `AbortSignal` to cancel. On iOS the bytes fetched so far are
  kept, so a later download of the same source resumes rather than restarts.
- **`forceDownload`** — re-download even when cached.

## Caching behavior

Downloads go to a persistent cache keyed by URL, and this is what keeps repeat
launches fast:

- A file that is already cached resolves immediately — no network round trip.
- Concurrent downloads of the same URL are deduplicated into one transfer.
- On Android, fetching goes through the system DownloadManager, which handles
  multi-gigabyte files and continues in the background; on iOS it streams and
  resumes an interrupted download from where it stopped.

Use `forceDownload` to bypass the cache and replace a file. Otherwise, downloading
the same model again is effectively free.

## Where to go next

- [Getting Started](./01-getting-started.md) — install the library and run your first model.
- [Exporting Custom Models](../03-core-and-advanced/07-exporting-custom-models.md) — bring your own `.pte` and match a pipeline.
- [Models & Tensors](../03-core-and-advanced/02-models-and-tensors.md) — load a downloaded `.pte` directly with the lower-level API.

### API reference

- [`download()`](../06-api-reference/functions/download.md) · [`DownloadOptions`](../06-api-reference/interfaces/DownloadOptions.md)
- [`useResourceDownload()`](../06-api-reference/functions/useResourceDownload.md) · [`ResourceOptions`](../06-api-reference/type-aliases/ResourceOptions.md)
- [`models`](../06-api-reference/variables/models.md)
