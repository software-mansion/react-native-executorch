# Function: inspectModel()

> **inspectModel**(`source`): `Promise`\<[`ModelInspection`](../type-aliases/ModelInspection.md)\>

Defined in: [utils.ts:71](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L71)

Inspects an ExecuTorch model file to fetch its metadata and signature info
for all methods.

If a remote HTTP URL is provided, the utility downloads the model to a
temporary local file, reads its configuration and method signatures
(inputs/outputs shapes, types, and tags), and deletes the temporary file
before returning.

That download is deliberately throwaway: it does not go through
[download](download.md), so the file never enters the persistent resource cache and
is not reused. Inspecting a remote model therefore re-downloads it on every
call and leaves nothing behind — call [download](download.md) first and inspect the
returned local path if you also intend to run the model.

## Parameters

### source

`string`

The remote HTTP URL or local path to the `.pte` model file.

## Returns

`Promise`\<[`ModelInspection`](../type-aliases/ModelInspection.md)\>

A promise resolving to an object containing the model source, method
signature metadata, and per-method backend usage.
