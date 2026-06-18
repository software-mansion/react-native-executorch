---
name: model-schema-validation
description: Use when defining SymbolicTensor constraints, validating ExecuTorch model shapes, checking method signatures, or verifying dynamic tensor dimensions.
metadata:
  id: model_schema_validation
  scope: src/core/modelSchema.ts, src/extensions/*/tasks/*
---

# Skill: Model Schema Validation Guide

Use this guide to define and enforce structural constraints (shapes and data types) on loaded ExecuTorch `.pte` models using `validateModelSchema`.

---

## 🔍 Why Validate Model Schemas?

Every ExecuTorch model exposes metadata about its execution methods (typically `'forward'`), including:
* Input and output argument counts.
* The expected types (primitives like `number`/`boolean` or `Tensor`).
* The data type (`float32`, `int32`, etc.) and the shape arrays of tensors.

To prevent runtime crashes and memory allocation mismatches in C++, the TypeScript task pipeline must validate that the provided model matches its expected execution signature *before* allocating static tensors or executing inference.

---

## 🛠️ Validation API Reference

```typescript
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';

const meta = validateModelSchema(
  model,
  methodName,
  expectedInputs,
  expectedOutputs
);
```

### Constraints Types:
* **Primitives**: `'number' | 'boolean' | 'null'`
* **Tensors**: Defined via the `SymbolicTensor(dtype?, ...shapes)` helper.

---

## 📏 Symbolic Dimensions & Dynamic Shapes

Tensors often support dynamic dimensions (such as varying image sizes `'H'`, `'W'` or dynamic batch/prediction counts `'N'`).
The `SymbolicTensor` helper supports specifying **Symbolic Shapes** where integers are static matching constraints, and string names act as runtime variables.

### How Symbolic Matching Works:
1. **Numbers (Static Match)**:
   If a dimension is defined as a number, the loaded model's tensor dimension must match that exact integer.
   * *Example*: `[1, 3, 'H', 'W']` requires the batch dimension to be exactly `1`, and channels to be exactly `3`.

2. **Strings (Symbolic Match)**:
   If a dimension is defined as a string (e.g., `'H'`), the validator binds the actual dimension size to that symbol name.
   * *Symbolic Constraint Rules*: Within a single tensor, if a symbol (e.g., `'H'`) appears multiple times, the corresponding dimensions must be equal.

3. **Multiple Alternative Shapes**:
   You can provide multiple shape variations to `SymbolicTensor` to support models compiled in different layouts (e.g., channels-first vs. channels-last).
   * *Example*: `SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])` allows either 4D or 3D float32 layouts.

---

## 📋 Common Validation Recipes

### 1. Classification
Accepts an image tensor and outputs a 2D class probabilities array:
```typescript
const meta = validateModelSchema(
  model,
  'forward',
  [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])], // Input
  [SymbolicTensor('float32', [1, 'N'], ['N'])]                  // Output: logits / probs
);

const inpShape = meta.inputTensorMeta[0]!.shape;
const outShape = meta.outputTensorMeta[0]!.shape;
```

### 2. Image-to-Image / Style Transfer
Accepts an image tensor and returns a modified image tensor with identical dimensions:
```typescript
const meta = validateModelSchema(
  model,
  'forward',
  [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])], // Input
  [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])]  // Output
);
```

### 3. Object Detection (Dynamic Boxes Count)
Accepts an image tensor, and outputs boxes, scores, and class labels for `N` dynamic detections:
```typescript
const meta = validateModelSchema(
  model,
  'forward',
  [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])],
  [
    SymbolicTensor('float32', ['N', 4]), // Bounding boxes (xyxy / xywh)
    SymbolicTensor('float32', ['N']),    // Prediction confidence scores
    SymbolicTensor('float32', ['N']),    // Predicted class labels
  ]
);
```

---

## 🚫 Avoid / Anti-Patterns

* **Do NOT write imperative size/type checks manually:** Avoid writing custom shape/type assertion blocks (e.g., `if (tensor.shape[0] !== 1)`). Always use the declarative `validateModelSchema` utility, which reports unified, readable mismatch errors.
* **Do NOT use hardcoded integers for dynamic dimensions:** If a shape can vary (e.g., dynamic height, width, or batch sizes), use a string symbol (like `'H'`, `'W'`, `'N'`) to allow dynamic matching.
* **Do NOT skip validation at startup:** Always validate the model schema *before* creating pre-allocated static tensors, preventing native memory crashes from mismatched layouts.

---

## 📋 Verification Checklist

When specifying model schema validations, verify that:
- [ ] Schema validation is performed immediately after model loading and before tensor initialization.
- [ ] All dynamic dimensions (e.g., dynamic box counts, channels-last heights/widths) are defined as string symbols.
- [ ] Multiple shape variations are provided to `SymbolicTensor` if channels-first and channels-last layouts are both supported.
- [ ] Input and output constraints map accurately to standard model specifications (e.g. dense logits, standard bounding boxes layouts).
