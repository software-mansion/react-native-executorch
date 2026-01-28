# Function: useExecutorchModule()

> **useExecutorchModule**(`executorchModuleConfiguration`): [`ExecutorchModuleType`](../interfaces/ExecutorchModuleType.md)

Defined in: [packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts#L11)

React hook for managing an arbitrary Executorch module instance.

## Parameters

### executorchModuleConfiguration

[`ExecutorchModuleProps`](../interfaces/ExecutorchModuleProps.md)

Configuration object containing `modelSource` and optional `preventLoad` flag.

## Returns

[`ExecutorchModuleType`](../interfaces/ExecutorchModuleType.md)

Ready to use Executorch module.
