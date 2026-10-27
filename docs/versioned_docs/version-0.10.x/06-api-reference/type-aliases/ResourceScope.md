# Type Alias: ResourceScope

> **ResourceScope** = `object`

Defined in: [core/lifetime.ts:26](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/lifetime.ts#L26)

A set of native resources with a single teardown.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [core/lifetime.ts:40](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/lifetime.ts#L40)

Releases every tracked resource, most recently allocated first. Safe to
call more than once: a second call has nothing left to release.

#### Returns

`void`

---

### track()

> `readonly` **track**: \<`R`\>(`resource`) => `R`

Defined in: [core/lifetime.ts:34](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/lifetime.ts#L34)

Takes ownership of a resource and returns it unchanged, so it can wrap an
allocation in place.

#### Type Parameters

##### R

`R` _extends_ [`NativeResource`](NativeResource.md)

The concrete [NativeResource](NativeResource.md) type being tracked.

#### Parameters

##### resource

`R`

The resource to take ownership of.

#### Returns

`R`

The same `resource`, unchanged.
