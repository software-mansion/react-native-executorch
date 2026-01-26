# Function: useExecutorchModule()

> **useExecutorchModule**(`executorchModuleConfiguration`): [`ExecutorchModuleType`](../interfaces/ExecutorchModuleType.md)

Defined in: [packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts#L11)

React hook for managing an arbitrary Executorch module instance.

## Parameters

### executorchModuleConfiguration

[`ExecutorchModuleProps`](../interfaces/ExecutorchModuleProps.md)

Configuration object containing `modelSource` and optional `preventLoad` flag.

## Returns

[`ExecutorchModuleType`](../interfaces/ExecutorchModuleType.md)

Ready to use Executorch module.
