# Function: calculateDownloadProgress()

> **calculateDownloadProgress**(`totalLength`, `previousFilesTotalLength`, `currentFileLength`, `setProgress`): (`progress`) => `void`

Defined in: [packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts:155](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/utils/ResourceFetcherUtils.ts#L155)

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
