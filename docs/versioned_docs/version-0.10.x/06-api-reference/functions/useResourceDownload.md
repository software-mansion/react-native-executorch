# Function: useResourceDownload()

> **useResourceDownload**\<`T`\>(`config`, `options?`): `object`

Defined in: [hooks/useResourceDownload.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useResourceDownload.ts#L37)

React hook to manage downloading and local caching of the remote resources
(e.g. `.pte` models) referenced by a value.

`config` may be a single URL or any nested object/array holding them —
typically a whole model config. Every remote URL found inside is downloaded
into the persistent resource cache (cache hits resolve immediately) and
replaced by its local path, so `resource` mirrors `config` exactly and can be
passed straight to a `create<Task>` factory. Progress is reported across all
files, weighted by size, and interrupted downloads resume on the next attempt
instead of restarting.

Work is keyed on the _value_ of `config` rather than its identity, so passing
an inline object is safe. Any change to the config resolves again, which is
cheap for the files themselves (already-cached URLs are a no-op) but does
rebuild whatever pipeline consumes `resource` — correct, since `create<Task>`
factories bake their options in at construction time.

For imperative usage, see [download](download.md).

## Type Parameters

### T

`T`

The shape of the value being resolved.

## Parameters

### config

The value whose remote URLs should be resolved to local paths,
or `undefined` to prevent loading.

`T` | `undefined`

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

An object containing the resolved value, the download progress
percentage, and any download error.

### downloadError

> **downloadError**: `Error` \| `undefined`

### downloadProgress

> **downloadProgress**: `number`

### resource

> **resource**: `T` \| `undefined`

## See

[download](download.md)
