# Function: triggerHuggingFaceDownloadCounter()

> **triggerHuggingFaceDownloadCounter**(`uri`): `Promise`\<`void`\>

Defined in: [utils/ResourceFetcherUtils.ts:185](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L185)

Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
More information: https://huggingface.co/docs/hub/models-download-stats

## Parameters

### uri

`string`

The URI of the file being downloaded.

## Returns

`Promise`\<`void`\>
