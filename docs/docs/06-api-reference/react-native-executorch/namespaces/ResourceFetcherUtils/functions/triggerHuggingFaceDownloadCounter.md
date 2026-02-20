# Function: triggerHuggingFaceDownloadCounter()

> **triggerHuggingFaceDownloadCounter**(`uri`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:188](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L188)

Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
More information: https://huggingface.co/docs/hub/models-download-stats

## Parameters

### uri

`string`

The URI of the file being downloaded.

## Returns

`Promise`\<`void`\>
