# Variable: defaultWorkletRuntime

> `const` **defaultWorkletRuntime**: `WorkletRuntime`

Defined in: [core/runtime.ts:25](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/runtime.ts#L25)

The default background worklet runtime used for all model execution.

This runtime runs on a dedicated thread separate from the React Native JS
thread, preventing model loading and inference from blocking the UI. Pass it
explicitly (or a custom `WorkletRuntime`) to [wrapAsync](../functions/wrapAsync.md) when you
need fine-grained control over which thread work executes on.
