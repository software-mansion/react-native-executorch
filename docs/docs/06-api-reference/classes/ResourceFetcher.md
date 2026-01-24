# Class: ResourceFetcher

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:57](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L57)

## Constructors

### Constructor

> **new ResourceFetcher**(): `ResourceFetcher`

#### Returns

`ResourceFetcher`

## Properties

### downloads

> `static` **downloads**: `Map`\<[`ResourceSource`](../type-aliases/ResourceSource.md), `DownloadResource`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:58](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L58)

## Methods

### cancelFetching()

> `static` **cancelFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:251](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L251)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>

***

### deleteResources()

> `static` **deleteResources**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:278](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L278)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>

***

### fetch()

> `static` **fetch**(`callback`, ...`sources`): `Promise`\<`string`[] \| `null`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:60](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L60)

#### Parameters

##### callback

(`downloadProgress`) => `void`

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`string`[] \| `null`\>

***

### getFilesTotalSize()

> `static` **getFilesTotalSize**(...`sources`): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:290](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L290)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`number`\>

***

### listDownloadedFiles()

> `static` **listDownloadedFiles**(): `Promise`\<`string`[]\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:268](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L268)

#### Returns

`Promise`\<`string`[]\>

***

### listDownloadedModels()

> `static` **listDownloadedModels**(): `Promise`\<`string`[]\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:273](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L273)

#### Returns

`Promise`\<`string`[]\>

***

### pauseFetching()

> `static` **pauseFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:241](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L241)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>

***

### resumeFetching()

> `static` **resumeFetching**(...`sources`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcher.ts:246](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/utils/ResourceFetcher.ts#L246)

#### Parameters

##### sources

...[`ResourceSource`](../type-aliases/ResourceSource.md)[]

#### Returns

`Promise`\<`void`\>
