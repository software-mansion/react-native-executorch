# Function: loadModel()

> **loadModel**(`modelPath`, `options?`): [`Model`](../type-aliases/Model.md)

Defined in: [core/model.ts:126](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L126)

Loads and compiles an ExecuTorch `.pte` model from the local filesystem.

The model is loaded synchronously into native memory. Prefer calling this
inside a worklet runtime thread (via [wrapAsync](wrapAsync.md)) to avoid blocking the
JS thread during compilation.

## Parameters

### modelPath

`string`

The absolute local path to the `.pte` model file.

### options?

[`LoadModelOptions`](../type-aliases/LoadModelOptions.md)

Optional loading configuration. See [LoadModelOptions](../type-aliases/LoadModelOptions.md).

## Returns

[`Model`](../type-aliases/Model.md)

The compiled [Model](../type-aliases/Model.md) instance, ready for execution.

## Throws

Thrown with code `LOAD_FAILED` if the model file
cannot be opened, has an invalid format, or fails native initialization.

## See

[wrapAsync](wrapAsync.md)

## Example

```typescript
const model = loadModel('/path/to/model.pte');
const input = tensor('float32', [1, 3, 224, 224]);
const output = tensor('float32', [1, 1000]);
try {
  model.execute('forward', [input], [output]);
  // ...
} finally {
  input.dispose();
  output.dispose();
  model.dispose();
}
```
