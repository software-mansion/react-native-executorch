# Function: calculateDownloadProgress()

> **calculateDownloadProgress**(`totalLength`, `previousFilesTotalLength`, `currentFileLength`, `setProgress`): (`progress`) => `void`

Defined in: [utils/ResourceFetcherUtils.ts:154](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L154)

Creates a progress callback that scales the current file's progress
relative to the total size of all files being downloaded.

## Parameters

### totalLength

`number`

The total size of all files in the download batch.

### previousFilesTotalLength

`number`

The sum of sizes of files already downloaded.

### currentFileLength

`number`

The size of the file currently being downloaded.

### setProgress

(`downloadProgress`) => `void`

The main callback to update the global progress.

## Returns

A function that accepts the progress (0-1) of the current file.

> (`progress`): `void`

### Parameters

#### progress

`number`

### Returns

`void`
