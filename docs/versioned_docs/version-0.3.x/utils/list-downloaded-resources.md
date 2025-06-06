---
title: List Downloaded Resources
sidebar_position: 1
---

This module provides functions to retrieve a list of downloaded files stored in the application's document directory inside the `react-native-executorch/` directory. These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.

## listDownloadedFiles

Lists all the downloaded files used by React Native ExecuTorch.

### Reference

```typescript
import { listDownloadedFiles } from 'react-native-executorch';

const filesUris = await listDownloadedFiles();
```

### Returns

`Promise<string[]>` - A promise, which resolves to an array of URIs for all the downloaded files.

:::info
Since this function returns all the downloaded files, it also includes all the downloaded models.
If you want to list only the downloaded models, use the [listDownloadedModels](./list-downloaded-resources.md#listdownloadedmodels) function.
:::

## listDownloadedModels

Lists all the downloaded models used by React Native ExecuTorch.

### Reference

```typescript
import { listDownloadedModels } from 'react-native-executorch';

const modelsUris = await listDownloadedModels();
```

### Returns

`Promise<string[]>` - A promise, which resolves to an array of URIs for all the downloaded models.
