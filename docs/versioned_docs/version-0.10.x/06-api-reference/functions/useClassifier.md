# Function: useClassifier()

> **useClassifier**\<`L`\>(`config`, `options?`): `object`

Defined in: [hooks/useClassifier.ts:23](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useClassifier.ts#L23)

React hook to load and run an image classification model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createClassifier](createClassifier.md).

## Type Parameters

### L

`L`

The type representing the classification labels.

## Parameters

### config

[`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`L`\>

The image classification model configuration.
See [ClassifierModel](../type-aliases/ClassifierModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [Classifier](../type-aliases/Classifier.md) (without `dispose`),
combined with loading state, download progress, and labels.

### classify

> **classify**: (`input`, `options?`) => `Promise`\<[`Classification`](../type-aliases/Classification.md)\<`L`\>[]\> \| `undefined` = `model.classify`

### classifyWorklet

> **classifyWorklet**: (`input`, `options?`) => [`Classification`](../type-aliases/Classification.md)\<`L`\>[] \| `undefined` = `model.classifyWorklet`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### labels

> **labels**: readonly `L`[] = `config.modelOpts.labels`

### resource

> **resource**: [`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`L`\> \| `undefined`

## See

[Classifier](../type-aliases/Classifier.md)
