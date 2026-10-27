# Type Alias: ResourceOptions

> **ResourceOptions** = `object`

Defined in: [utils.ts:16](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L16)

Options accepted by [useResourceDownload](../functions/useResourceDownload.md) and by every `use<Task>` hook
built on top of it.

## Properties

### forceDownload?

> `readonly` `optional` **forceDownload**: `boolean`

Defined in: [utils.ts:24](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L24)

Re-downloads every remote source even when it is already cached, replacing
the cached copy. Use to recover from a corrupted file or to pick up a model
that changed behind a stable URL.

---

### preventLoad?

> `readonly` `optional` **preventLoad**: `boolean`

Defined in: [utils.ts:18](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L18)

If true, prevents checks and downloads, resetting the hook state.
