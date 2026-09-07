# Downloading Models

A model config is one or more files — the `.pte` program, and often a tokenizer, phonemizer, or label map alongside it — that have to be present on the device before inference can run. React Native ExecuTorch downloads those files for you and caches them persistently, so in most apps you never touch the filesystem directly: you point a pipeline at a model config and the library fetches whatever isn't already cached.

## Where models come from[​](#where-models-come-from "Direct link to Where models come from")

A model source is either remote or local:

* **Pre-exported models** live in our [HuggingFace collection](https://huggingface.co/software-mansion/collections) and are addressed through the [`models`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models) registry. Each entry bundles every file a pipeline needs behind one object. This registry is the single source of truth for the tuned, ready-to-run models.
* **Your own models** are plain URLs or local paths — a file bundled with the app, a `file://` path, or a URL on your own host (see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md)).

Local paths are always passed through untouched; only `http(s)` URLs are ever downloaded.

## Automatic downloading with hooks[​](#automatic-downloading-with-hooks "Direct link to Automatic downloading with hooks")

The [`use<Task>`](https://docs.swmansion.com/react-native-executorch/docs/category/extensions.md) hooks and the [`useResourceDownload`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useResourceDownload) hook download and cache a model's files automatically. Pass a config; the hook fetches anything not already cached, reports progress, and hands back the same config with every URL replaced by its local path.

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

Both hooks accept [`ResourceOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceOptions):

* [**`preventLoad`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceOptions#preventload) — skip the download entirely (and reset state), for deferring a fetch until the user opts in.
* [**`forceDownload`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceOptions#forcedownload) — re-fetch even when cached, to replace a corrupted file or pick up a model that changed behind a stable URL.

## Imperative downloading[​](#imperative-downloading "Direct link to Imperative downloading")

When you're not in a component — a background task, a custom pipeline, a preloading step — use the imperative [`download`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/download) function. It takes a URL, or any nested object/array of them (typically a whole model config), downloads every remote leaf, and resolves with the same value with URLs replaced by local paths — ready to pass straight to a `create<Task>` factory:

```typescript
import { download, models } from 'react-native-executorch';

const model = await download(models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32, {
  onProgress: (p) => console.log(`${Math.round(p * 100)}%`),
});

// `model` now holds local paths; hand it to a pipeline factory

```

[`DownloadOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DownloadOptions) covers the common needs:

* [**`onProgress(p)`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DownloadOptions#onprogress) — overall progress in `[0, 1]`, weighted by each file's byte size so a large model isn't reported the same as a small tokenizer.
* [**`signal`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DownloadOptions#signal) — an `AbortSignal` to cancel. The bytes fetched so far are kept so a later download of the same source resumes instead of restarting (except on Android without the optional background downloader, where the system `DownloadManager` discards a cancelled transfer).
* [**`forceDownload`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DownloadOptions#forcedownload) — re-download even when cached.

## Caching behavior[​](#caching-behavior "Direct link to Caching behavior")

Downloads go to a persistent cache keyed by URL, and this is what keeps repeat launches fast:

* A file that is already cached resolves immediately — no network round trip.
* Concurrent downloads of the same URL are deduplicated into one transfer.
* Without extra dependencies, fetching falls back to what each platform supports natively: the system `DownloadManager` on Android (which continues in the background), and a streaming request on iOS (which pauses when the app is suspended and resumes when reopened).
* To keep transfers running in the background across both iOS and Android and survive the app being killed, install the optional peer dependency [`@kesha-antonov/react-native-background-downloader`](https://github.com/kesha-antonov/react-native-background-downloader) (`>=4.4.0`). The library detects and uses it automatically with zero extra configuration.

Use `forceDownload` to bypass the cache and replace a file. Otherwise, downloading the same model again is effectively free.

## Anonymous Telemetry & Download Counter[​](#anonymous-telemetry--download-counter "Direct link to Anonymous Telemetry & Download Counter")

When downloading pre-exported models from our Hugging Face repositories, the fetcher pings Hugging Face's standard model download counter (via a lightweight `HEAD` request to `config.json`). However, because Hugging Face's built-in metrics can be delayed or inconsistent for direct file downloads, the library also sends a lightweight, anonymous download event to Software Mansion. This exists solely to help us understand which models community members rely on and prioritize maintenance and optimizations accordingly. No user data, device IDs, IP addresses, or personally identifiable information are ever stored or tracked.

Telemetry is enabled by default. To opt out, call [`setTelemetryEnabled(false)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/setTelemetryEnabled) once at application startup:

```typescript
import { setTelemetryEnabled } from 'react-native-executorch';

// Opt out of anonymous download analytics
setTelemetryEnabled(false);

```

## Where to go next[​](#where-to-go-next "Direct link to Where to go next")

* [Getting Started](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started.md) — install the library and run your first model.
* [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md) — bring your own `.pte` and match a pipeline.
* [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md) — load a downloaded `.pte` directly with the lower-level API.

### API reference[​](#api-reference "Direct link to API reference")

* [`download()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/download) · [`DownloadOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/DownloadOptions)
* [`useResourceDownload()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useResourceDownload) · [`ResourceOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceOptions)
* [`setTelemetryEnabled()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/setTelemetryEnabled) · [`models`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models)
