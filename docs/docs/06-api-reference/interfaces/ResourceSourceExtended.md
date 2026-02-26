# Interface: ResourceSourceExtended

Defined in: [utils/ResourceFetcherUtils.ts:70](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L70)

Extended interface for resource sources, tracking download state and file locations.

## Properties

### cacheFileUri?

> `optional` **cacheFileUri**: `string`

Defined in: [utils/ResourceFetcherUtils.ts:104](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L104)

The URI where the file is cached.

---

### callback()?

> `optional` **callback**: (`downloadProgress`) => `void`

Defined in: [utils/ResourceFetcherUtils.ts:84](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L84)

Optional callback to report download progress (0 to 1).

#### Parameters

##### downloadProgress

`number`

#### Returns

`void`

---

### fileUri?

> `optional` **fileUri**: `string`

Defined in: [utils/ResourceFetcherUtils.ts:99](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L99)

The local file URI where the resource is stored.

---

### next?

> `optional` **next**: `ResourceSourceExtended`

Defined in: [utils/ResourceFetcherUtils.ts:109](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L109)

Reference to the next resource in a linked chain of resources.

---

### results

> **results**: `string`[]

Defined in: [utils/ResourceFetcherUtils.ts:89](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L89)

Array of paths or identifiers for the resulting files.

---

### source

> **source**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [utils/ResourceFetcherUtils.ts:74](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L74)

The original source definition.

---

### sourceType

> **sourceType**: [`SourceType`](../enumerations/SourceType.md)

Defined in: [utils/ResourceFetcherUtils.ts:79](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L79)

The type of the source (local, remote, etc.).

---

### uri?

> `optional` **uri**: `string`

Defined in: [utils/ResourceFetcherUtils.ts:94](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L94)

The URI of the resource.
