# Function: triggerHuggingFaceDownloadCounter()

> **triggerHuggingFaceDownloadCounter**(`uri`): `Promise`\<`void`\>

Defined in: [utils/ResourceFetcherUtils.ts:142](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L142)

Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
More information: https://huggingface.co/docs/hub/models-download-stats

## Parameters

### uri

`string`

The URI of the file being downloaded.

## Returns

`Promise`\<`void`\>
