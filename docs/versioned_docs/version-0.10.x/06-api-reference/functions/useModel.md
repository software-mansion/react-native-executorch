# Function: useModel()

> **useModel**\<`TConfig`, `TModel`\>(`createModel`, `config`): `object`

Defined in: [hooks/useModel.ts:23](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useModel.ts#L23)

React hook to instantiate and manage a model or task instance with automatic
lifetime management.

It manages the lifecycle of a model or task runner instance. When the
configuration changes or the component unmounts, it automatically disposes of
the previous instance to prevent native memory leaks.

## Type Parameters

### TConfig

`TConfig`

The configuration type passed to the model creator.

### TModel

`TModel` _extends_ `object`

The type of the compiled model instance containing a
`dispose` method.

## Parameters

### createModel

(`config`) => `Promise`\<`TModel`\>

An asynchronous factory function to instantiate the model
or task runner.

### config

The configuration to pass to `createModel`, or `undefined` if
the model shouldn't be loaded yet. It is tracked by value, so the model is
re-created whenever the config's contents change and passing an inline object
is safe.

`TConfig` | `undefined`

## Returns

`object`

An object containing the loaded model instance and any instantiation
error.

### error

> **error**: `Error` \| `undefined`

### model

> **model**: `TModel` \| `undefined`
