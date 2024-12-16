---
title: ExecuTorch Bindings
sidebar_position: 1
---

ExecuTorch bindings allows you to work directly with it's [Module API](https://pytorch.org/executorch/stable/extension-module.html) from Javascript.

:::info[Info]
As for now the source API isn't fully covered yet, the most crucial part are implemented enabling you to work with exported models.
:::

The core element of our bindings is `useExecutorchModule` hook. You can use it by executing following code snippet:

```typescript
import { useExecutorchModule } from 'react-native-executorch';

const executorchModule = useExecutorchModule({
  modelSource: require('../assets/models/model.pte'),
});
```

Presented code fetches the model from [specified source](../fundamentals/loading-models.md), and loads it into memory. Under the hood `.load()` method from original API is called on module object.

### Arguments

**`modelSource`** - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

### Returns
