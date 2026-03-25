# Model Registry

The [Model Registry](https://docs.swmansion.com/react-native-executorch/docs/next/api-reference/variables/MODEL_REGISTRY) is a collection of all pre-configured model definitions shipped with React Native ExecuTorch. Each entry contains the model's name and all source URLs needed to download and run it, so you don't have to manage URLs manually.

## Usage[​](#usage "Direct link to Usage")

```typescript
import { MODEL_REGISTRY, LLAMA3_2_1B } from 'react-native-executorch';

```

### Accessing a model directly[​](#accessing-a-model-directly "Direct link to Accessing a model directly")

Every model config is exported as a standalone constant:

```typescript
import { LLAMA3_2_1B } from 'react-native-executorch';

const llm = useLLM({ model: LLAMA3_2_1B });

```

### Listing all models[​](#listing-all-models "Direct link to Listing all models")

Use `MODEL_REGISTRY` to discover and enumerate all available models:

```typescript
import { MODEL_REGISTRY } from 'react-native-executorch';

// Get all model names
const names = Object.values(MODEL_REGISTRY.ALL_MODELS).map((m) => m.modelName);

// Find models by name
const whisperModels = Object.values(MODEL_REGISTRY.ALL_MODELS).filter((m) =>
  m.modelName.includes('whisper')
);

```
