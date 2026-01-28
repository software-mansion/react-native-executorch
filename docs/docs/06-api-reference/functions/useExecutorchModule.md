# Function: useExecutorchModule()

> **useExecutorchModule**(`executorchModuleConfiguration`): [`ExecutorchModuleType`](../interfaces/ExecutorchModuleType.md)

Defined in: [packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts#L12)

React hook for managing an arbitrary Executorch module instance.

## Parameters

### executorchModuleConfiguration

[`ExecutorchModuleProps`](../interfaces/ExecutorchModuleProps.md)

Configuration object containing `modelSource` and optional `preventLoad` flag.

## Returns

[`ExecutorchModuleType`](../interfaces/ExecutorchModuleType.md)

Ready to use Executorch module.
