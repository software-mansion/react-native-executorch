# Interface: ResourceSourceExtended

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:72](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L72)

Extended interface for resource sources, tracking download state and file locations.

## Properties

### cacheFileUri?

> `optional` **cacheFileUri**: `string`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:106](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L106)

The URI where the file is cached.

---

### callback()?

> `optional` **callback**: (`downloadProgress`) => `void`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:86](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L86)

Optional callback to report download progress (0 to 1).

#### Parameters

##### downloadProgress

`number`

#### Returns

`void`

---

### fileUri?

> `optional` **fileUri**: `string`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:101](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L101)

The local file URI where the resource is stored.

---

### next?

> `optional` **next**: `ResourceSourceExtended`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:111](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L111)

Reference to the next resource in a linked chain of resources.

---

### results

> **results**: `string`[]

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:91](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L91)

Array of paths or identifiers for the resulting files.

---

### source

> **source**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:76](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L76)

The original source definition.

---

### sourceType

> **sourceType**: [`SourceType`](../enumerations/SourceType.md)

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:81](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L81)

The type of the source (local, remote, etc.).

---

### uri?

> `optional` **uri**: `string`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:96](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L96)

The URI of the resource.
