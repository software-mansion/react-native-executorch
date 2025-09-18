---
title: TextToImageModule
---

TypeScript API implementation of the [useTextToImage](../../02-hooks/02-computer-vision/useTextToImage.md) hook.

## Reference

```typescript
import { TextToImageModule, BK_SDM_TINY_VPRED } from 'react-native-executorch';

const input = 'a castle';

// Creating an instance
const textToImageModule = new TextToImageModule();

// Loading the model
await textToImageModule.load(BK_SDM_TINY_VPRED);

// Running the model
const image = await textToImageModule.forward(input);
```

### Methods

| Method        | Type                                                                                                                                                                                                                                                        | Description                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constructor` | `(inferenceCallback?: (stepIdx: number) => void)`                                                                                                                                                                                                           | Creates a new instance of TextToImageModule with optional callback on inference step.                                                                                                                                                                                                                                                                                       |
| `load`        | `(model: {tokenizerSource: ResourceSource; schedulerSource: ResourceSource; encoderSource: ResourceSource; unetSource: ResourceSource; decoderSource: ResourceSource; }, onDownloadProgressCallback: (progress: number) => void = () => {}): Promise<void>` | Loads the model.                                                                                                                                                                                                                                                                                                                                                            |
| `forward`     | `(input: string) => Promise<string>`                                                                                                                                                                                                                        | Runs model inference with raw input string. You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method. It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper. If you want a simple chat with model the consider using`sendMessage` |
| `delete`      | `() => void`                                                                                                                                                                                                                                                | Method to delete the model from memory. Note you cannot delete model while it's generating. You need to interrupt it first and make sure model stopped generation.                                                                                                                                                                                                          |
| `interrupt`   | `() => void`                                                                                                                                                                                                                                                | Interrupts model generation. It may return one more token after interrupt.                                                                                                                                                                                                                                                                                                  |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts an object:

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the location of the model binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

It accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

## Listening for generated tokens

To subscribe to the token generation event, you can pass `tokenCallback` or `messageHistoryCallback` functions to the constructor. `tokenCallback` is called on every token and contains only the most recent token. `messageHistoryCallback` is called whenever model finishes generation and contains all message history including user's and model's last messages.

## Deleting the model from memory

To delete the model from memory, you can use the `delete` method.
