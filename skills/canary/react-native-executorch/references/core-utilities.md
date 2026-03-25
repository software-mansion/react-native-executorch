---
title: RN Executorch core Utilities
description: Reference for using core RN Executorch utils - low-level ExecuTorch bindings, resource management, and error handling.
---

# useExecutorchModule

**Purpose:** Low-level bindings to ExecuTorch Module API for custom model integration.

**Use cases:** Custom models without dedicated hooks, advanced model control, experimental models, research applications.

**Important:** Use dedicated hooks (useLLM, useClassification, etc.) when available. This hook is for custom models where no pre-built solution exists.

## Basic Usage

```typescript
import { useExecutorchModule } from 'react-native-executorch';

const executorchModule = useExecutorchModule({
  modelSource: require('../assets/models/model.pte'),
});
```

## Understanding TensorPtr

A `TensorPtr` is the JavaScript representation of a tensor passed to the model:

```typescript
interface TensorPtr {
  dataPtr: ArrayBuffer | TypedArray; // Raw data buffer
  sizes: number[]; // Tensor shape [batch, channels, height, width]
  scalarType: ScalarType; // Data type (FLOAT, INT, etc.)
}
```

## Example usage

```typescript
import {
  useExecutorchModule,
  ScalarType,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const executorchModule = useExecutorchModule({
  modelSource: STYLE_TRANSFER_CANDY,
});

const runInference = async () => {
  // Prepare input tensor (example: 640x640 RGB image)
  const inputTensor = {
    dataPtr: new Float32Array(1 * 3 * 640 * 640),
    sizes: [1, 3, 640, 640],
    scalarType: ScalarType.FLOAT,
  };

  try {
    // Perform the forward operation and receive the stylized image output.
    const output = await executorchModule.forward([inputTensor]);
    // Interpret the output ArrayBuffer
    // foo(output[0].dataPtr);
  } catch (error) {
    // Log any errors that occur during the forward pass.
    console.error('Error during model execution:', error);
  }
};
```

## Troubleshooting

**Preprocessing required:** You must handle all preprocessing (normalization, resizing, color space conversion) yourself.
**Postprocessing required:** Output interpretation is your responsibility based on your model's architecture.
**Shape matching:** Input tensor shapes must exactly match your model's expected input dimensions.
**Use dedicated hooks:** If a hook exists for your use case, use it instead for automatic pre/post-processing.

## Additional references

- [useExecutorchModule docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/executorch-bindings/useExecutorchModule)
- [useExecutorchModule API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useExecutorchModule)
- [ExecuTorch Module API](https://pytorch.org/executorch/stable/extension-module.html)
- [Typescript API implementation of useExecutorchModule](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/executorch-bindings/ExecutorchModule)

---

# ResourceFetcher

**Purpose:** Manage model and resource downloads with pause/resume capabilities.

**Use cases:** Download management, storage cleanup, progress tracking, offline-first apps.

## Built-in adapters vs custom adapter

React Native ExecuTorch does not bundle a resource fetcher — you bring your own. Two ready-made adapters are provided:

- **`ExpoResourceFetcher`** from `react-native-executorch-expo-resource-fetcher` — for Expo projects
- **`BareResourceFetcher`** from `react-native-executorch-bare-resource-fetcher` — for bare React Native projects

Register the adapter once at app startup before using any hooks or modules:

```typescript
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });
```

If neither adapter fits your needs (custom download library, private server, custom caching), you can implement the `ResourceFetcherAdapter` interface yourself. See [Custom Adapter](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/custom-adapter) for details.

## Basic Usage

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

// Download multiple resources with progress tracking
const downloadModels = async () => {
  try {
    const uris = await ExpoResourceFetcher.fetch(
      (progress) =>
        console.log(`Download progress: ${(progress * 100).toFixed(1)}%`),
      'https://example.com/llama3_2.pte',
      'https://example.com/qwen3.pte'
    );

    if (uris) {
      console.log('Downloaded files:', uris);
    } else {
      console.log('Download was paused or cancelled');
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

## Pause and Resume Downloads

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = ExpoResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved as: ', uris); // null, since we paused
});

await ExpoResourceFetcher.pauseFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);

const resolvedUris = await ExpoResourceFetcher.resumeFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

## Cancel Downloads

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

const uris = ExpoResourceFetcher.fetch(
  (progress) => console.log('Total progress:', progress),
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
).then((uris) => {
  console.log('URI resolved as: ', uris); // null, since we cancelled
});

await ExpoResourceFetcher.cancelFetching(
  'https://.../llama3_2.pte',
  'https://.../qwen3.pte'
);
```

## Manage Downloaded Resources

```typescript
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

// List all downloaded files
const listFiles = async () => {
  const files = await ExpoResourceFetcher.listDownloadedFiles();
  console.log('All downloaded files:', files);

  const models = await ExpoResourceFetcher.listDownloadedModels();
  console.log('Model files:', models);
};

// Clean up old resources
const cleanup = async () => {
  await ExpoResourceFetcher.deleteResources(
    'https://example.com/old_model.pte'
  );
  console.log('Old model deleted');
};
```

## Resource Types

Resources can be:

- Remote URLs (https://)
- Local file paths (file://)
- Asset references (require())
- JSON objects

## Troubleshooting

**Resume vs re-fetch:** Use `resumeFetching()` for faster resume. Calling `fetch()` again works but is slower.
**Progress callback:** Progress is reported as 0-1 for all downloads combined.
**Null return:** If `fetch()` returns `null`, download was paused or cancelled.
**Network errors:** Implement retry logic with exponential backoff for reliability.
**Pause/resume on Android:** `BareResourceFetcher` does not support pause/resume on Android. Use `ExpoResourceFetcher` if you need this on Android.

## Additional references

- [ResourceFetcher usage docs](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/usage)
- [Custom Adapter docs](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/custom-adapter)
- [Loading Models guide](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models)

---

# Error Handling

**Purpose:** Comprehensive error handling with typed error codes.

**Use cases:** Debugging, production error recovery, user feedback, logging and monitoring.

## Basic Error Handling

```typescript
import {
  LLMModule,
  LLAMA3_2_1B_QLORA,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';

try {
  const llm = await LLMModule.fromModelName(
    LLAMA3_2_1B_QLORA,
    (progress) => console.log(progress),
    (token) => console.log(token),
    (messages) => console.log(messages)
  );
  await llm.sendMessage('Hello!');
} catch (err) {
  if (err instanceof RnExecutorchError) {
    console.error(`Error code: ${err.code}`);
    console.error(`Error message: ${err.message}`);
  } else {
    throw err;
  }
}
```

## Handling Specific Error Types

```typescript
import {
  LLMModule,
  LLAMA3_2_1B_QLORA,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';

const llm = await LLMModule.fromModelName(
  LLAMA3_2_1B_QLORA,
  (progress) => console.log(progress),
  (token) => console.log(token),
  (messages) => console.log(messages)
);

const handleModelError = async (message: string) => {
  try {
    await llm.sendMessage(message);
  } catch (err) {
    if (err instanceof RnExecutorchError) {
      switch (err.code) {
        case RnExecutorchErrorCode.ModuleNotLoaded:
          console.error('Model not loaded.');
          break;

        case RnExecutorchErrorCode.ModelGenerating:
          console.error('Model busy. Waiting...');
          // Wait and retry, or queue the message
          break;

        case RnExecutorchErrorCode.InvalidConfig:
          console.error('Invalid configuration:', err.message);
          // Reset to default config
          await llm.configure({ topp: 0.9, temperature: 0.7 });
          break;

        default:
          console.error('Unexpected error:', err.message);
          throw err;
      }
    }
  }
};
```

## Error Categories

**Module State Errors**

- `ModuleNotLoaded` - Model not loaded yet
- `ModelGenerating` - Model already processing

**Configuration Errors**

- `InvalidConfig` - Invalid parameters
- `InvalidUserInput` - Bad input data
- `InvalidModelSource` - Wrong model source type
- `WrongDimensions` - Incorrect tensor shape

**File Operations**

- `FileReadFailed` - Can't read file
- `FileWriteFailed` - Can't write file

**Download & Resources**

- `DownloadInterrupted` - Download didn't complete
- `ResourceFetcherDownloadFailed` - Network/server error
- `ResourceFetcherDownloadInProgress` - Already downloading
- `ResourceFetcherAlreadyPaused` - Already paused
- `ResourceFetcherNotActive` - No active download

**Runtime Errors**

- `MemoryAllocationFailed` - Out of memory
- `NotSupported` - Operation not supported
- `InvalidProgram` - Invalid model file

For complete error reference, see the [Error Handling documentation](https://docs.swmansion.com/react-native-executorch/docs/utilities/error-handling).

## Troubleshooting

**Always check instance:** Use `instanceof RnExecutorchError` before accessing `.code`.
**Log error codes:** Include error codes in logs for easier debugging.
**Retry logic:** Implement exponential backoff for network and resource errors.
**User feedback:** Translate error codes into user-friendly messages.

## Additional references

- [Error Handling docs](https://docs.swmansion.com/react-native-executorch/docs/utilities/error-handling)
- [Complete error code list](https://docs.swmansion.com/react-native-executorch/docs/utilities/error-handling#reference)
