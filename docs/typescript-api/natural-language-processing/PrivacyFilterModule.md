# PrivacyFilterModule

TypeScript API implementation of the [usePrivacyFilter](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/usePrivacyFilter.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `PrivacyFilterModule` see: [`PrivacyFilterModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule).
* For all Privacy Filter models available out-of-the-box in React Native ExecuTorch see: [Privacy Filter Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---privacy-filter).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, PrivacyFilterModule } from 'react-native-executorch';
const model = await PrivacyFilterModule.fromModelName(
  models.privacy_filter.openai(),
  (progress) => console.log(progress)
);

const entities = await model.generate('My name is Sarah Chen.');

```

### Methods[​](#methods "Direct link to Methods")

All methods of `PrivacyFilterModule` are explained in details here: [`PrivacyFilterModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To create a ready-to-use instance, call the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule#frommodelname) factory with the following parameters:

* `namedSources` — Object containing:

  * `modelName` — Model name identifier.
  * `modelSource` — Location of the `.pte` model binary.
  * `tokenizerSource` — Location of the `tokenizer.json` file.
  * `labelNames` — BIOES label list. Index 0 must be `"O"`; the rest must follow the model's `id2label` mapping exactly.
  * `viterbiBiases` (optional) — Six-field bias struct that shifts the decoder's precision/recall tradeoff. Defaults to neutral (validity-only Viterbi).

* `onDownloadProgress` — Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `PrivacyFilterModule` instance.

For custom-exported models, use [`fromCustomModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule#fromcustommodel) instead — it takes the same fields as positional arguments and is convenient when you only have the raw resource locations.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, call the [`generate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule#generate) method on the module object with the text you want to scan. The method returns a promise that resolves to an array of detected PII entity spans. Long inputs are processed in sliding windows with 50% overlap (window size derived from the model's exported `forward` input shape); no truncation.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`generate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule#generate) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PrivacyFilterModule#delete) unless you load the module again.
