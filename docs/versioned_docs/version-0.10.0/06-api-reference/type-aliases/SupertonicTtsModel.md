# Type Alias: SupertonicTtsModel\<K\>

> **SupertonicTtsModel**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:74](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L74)

Model configuration required to instantiate the Supertonic Text-to-Speech
pipeline.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice style keys record constraint (strictly inferred from
voiceStyles keys).

## Properties

### modelPaths

> `readonly` **modelPaths**: `object`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:78](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L78)

Local or remote file paths to the 4 Supertonic `.pte` sub-models.

#### durationPredictor

> `readonly` **durationPredictor**: `string`

Path to the duration predictor `.pte` model.

#### textEncoder

> `readonly` **textEncoder**: `string`

Path to the text encoder `.pte` model.

#### vectorEstimator

> `readonly` **vectorEstimator**: `string`

Path to the vector estimator `.pte` model.

#### vocoder

> `readonly` **vocoder**: `string`

Path to the vocoder `.pte` model.

---

### name

> `readonly` **name**: `"supertonic"`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:76](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L76)

Discriminates this config from the other Text-to-Speech pipelines.

---

### unicodeIndexerPath

> `readonly` **unicodeIndexerPath**: `string`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:89](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L89)

Local or remote path to the `unicode_indexer.json` character mapping file.

---

### voiceStyles

> `readonly` **voiceStyles**: `Record`\<`K`, `string`\>

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:91](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L91)

Map of voice style names to local or remote JSON file paths.
