---
title: Model Registry
---

The [Model Registry](/react-native-executorch/docs/next/api-reference/variables/MODEL_REGISTRY) is a collection of all pre-configured model definitions shipped with React Native ExecuTorch. Each entry contains the model's name and all source URLs needed to download and run it, so you don't have to manage URLs manually.

## Usage

```typescript
import { MODEL_REGISTRY, LFM2_5_1_2B_INSTRUCT } from 'react-native-executorch';
```

### Accessing a model directly

Every model config is exported as a standalone constant:

```typescript
import { LFM2_5_1_2B_INSTRUCT } from 'react-native-executorch';

const llm = useLLM({ model: LFM2_5_1_2B_INSTRUCT });
```

### Listing all models

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
