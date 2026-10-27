# Type Alias: PrivacyFilter\<Label\>

> **PrivacyFilter**\<`Label`\> = `object`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:81](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L81)

Privacy filter task runner for detecting PII entities in text.

## Type Parameters

### Label

`Label` _extends_ `string` = `string`

The model's BIOES label space.

## Properties

### detectPii()

> `readonly` **detectPii**: (`input`) => `Promise`\<[`PiiEntity`](../react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md)\<[`PiiEntityType`](../react-native-executorch/namespaces/nlp/type-aliases/PiiEntityType.md)\<`Label`\>\>[]\>

Defined in: [extensions/nlp/tasks/privacyFilter.ts:94](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L94)

Asynchronously detects PII entity spans in the given text.

#### Parameters

##### input

`string`

The text string to scan for PII.

#### Returns

`Promise`\<[`PiiEntity`](../react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md)\<[`PiiEntityType`](../react-native-executorch/namespaces/nlp/type-aliases/PiiEntityType.md)\<`Label`\>\>[]\>

A promise resolving to the detected entity spans, in order.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### detectPiiWorklet()

> `readonly` **detectPiiWorklet**: (`input`) => [`PiiEntity`](../react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md)\<[`PiiEntityType`](../react-native-executorch/namespaces/nlp/type-aliases/PiiEntityType.md)\<`Label`\>\>[]

Defined in: [extensions/nlp/tasks/privacyFilter.ts:100](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L100)

Synchronous version of [detectPii](#detectpii) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

`string`

#### Returns

[`PiiEntity`](../react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md)\<[`PiiEntityType`](../react-native-executorch/namespaces/nlp/type-aliases/PiiEntityType.md)\<`Label`\>\>[]

---

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/nlp/tasks/privacyFilter.ts:85](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/privacyFilter.ts#L85)

Releases all allocated native resources.

#### Returns

`void`
