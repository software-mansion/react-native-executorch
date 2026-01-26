# Class: LLMModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L11)

## Constructors

### Constructor

> **new LLMModule**(`__namedParameters`): `LLMModule`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:14](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L14)

#### Parameters

##### \_\_namedParameters

###### messageHistoryCallback?

(`messageHistory`) => `void`

###### responseCallback?

(`response`) => `void`

###### tokenCallback?

(`token`) => `void`

#### Returns

`LLMModule`

## Methods

### configure()

> **configure**(`__namedParameters`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:52](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L52)

#### Parameters

##### \_\_namedParameters

###### chatConfig?

`Partial`\<[`ChatConfig`](../interfaces/ChatConfig.md)\>

###### generationConfig?

[`GenerationConfig`](../interfaces/GenerationConfig.md)

###### toolsConfig?

[`ToolsConfig`](../interfaces/ToolsConfig.md)

#### Returns

`void`

***

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:92](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L92)

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**(`index`): [`Message`](../interfaces/Message.md)[]

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:79](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L79)

#### Parameters

##### index

`number`

#### Returns

[`Message`](../interfaces/Message.md)[]

***

### forward()

> **forward**(`input`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:64](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L64)

#### Parameters

##### input

`string`

#### Returns

`Promise`\<`string`\>

***

### generate()

> **generate**(`messages`, `tools?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:69](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L69)

#### Parameters

##### messages

[`Message`](../interfaces/Message.md)[]

##### tools?

`Object`[]

#### Returns

`Promise`\<`string`\>

***

### getGeneratedTokenCount()

> **getGeneratedTokenCount**(): `number`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:88](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L88)

#### Returns

`number`

***

### interrupt()

> **interrupt**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:84](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L84)

#### Returns

`void`

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:30](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L30)

#### Parameters

##### model

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### tokenizerConfigSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

***

### sendMessage()

> **sendMessage**(`message`): `Promise`\<[`Message`](../interfaces/Message.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:74](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L74)

#### Parameters

##### message

`string`

#### Returns

`Promise`\<[`Message`](../interfaces/Message.md)[]\>

***

### setTokenCallback()

> **setTokenCallback**(`__namedParameters`): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/LLMModule.ts:44](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/LLMModule.ts#L44)

#### Parameters

##### \_\_namedParameters

###### tokenCallback

(`token`) => `void`

#### Returns

`void`
