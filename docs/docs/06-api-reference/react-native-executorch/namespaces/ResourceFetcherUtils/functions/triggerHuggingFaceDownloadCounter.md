# Function: triggerHuggingFaceDownloadCounter()

> **triggerHuggingFaceDownloadCounter**(`uri`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:188](https://github.com/software-mansion/react-native-executorch/blob/9db6e3b8b0f1b11ef66f7c45d29a251b31e9c252/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L188)

Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
More information: https://huggingface.co/docs/hub/models-download-stats

## Parameters

### uri

`string`

The URI of the file being downloaded.

## Returns

`Promise`\<`void`\>
