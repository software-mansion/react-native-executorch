# Function: wrapAsync()

> **wrapAsync**\<`Args`, `R`\>(`fn`, `runtime?`): (...`args`) => `Promise`\<`R`\>

Defined in: [core/runtime.ts:54](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/runtime.ts#L54)

Wraps a synchronous worklet function so that it runs asynchronously on a
background `WorkletRuntime` thread and returns a `Promise`.

The wrapper serializes arguments, dispatches the worklet to the target
runtime, awaits the result, and re-throws any error thrown inside the worklet
as an [RnExecuTorchError](RnExecuTorchError.md). This keeps heavy native operations (model
loading, tensor computation) off the React Native JS thread.

## Type Parameters

### Args

`Args` _extends_ `any`[]

The tuple of argument types of `fn`.

### R

`R`

The return type of `fn`.

## Parameters

### fn

(...`args`) => `R`

A synchronous worklet function to execute on the background
runtime.

### runtime?

`WorkletRuntime` = `defaultWorkletRuntime`

The worklet runtime to dispatch `fn` to. Defaults to
[defaultWorkletRuntime](../variables/defaultWorkletRuntime.md).

## Returns

An async function with the same signature as `fn` that resolves to
`fn`'s return value or rejects with an [RnExecuTorchError](RnExecuTorchError.md) if `fn` throws.

> (...`args`): `Promise`\<`R`\>

### Parameters

#### args

...`Args`

### Returns

`Promise`\<`R`\>

## Throws

Propagates any error thrown inside `fn` across the
worklet thread boundary.

## Example

```typescript
const asyncLoadModel = wrapAsync(loadModel);
const model = await asyncLoadModel('/path/to/model.pte');
```
