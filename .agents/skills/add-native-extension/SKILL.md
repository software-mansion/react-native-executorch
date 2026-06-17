---
name: add-native-extension
description: Use when adding a C++ extension, writing native JSI host functions, registering functions in C++ install maps, or compiling native code.
metadata:
  id: add_native_extension
  scope: cpp/extensions/*, src/extensions/*
---

# Skill: Add a Native C++ Extension & JSI Bindings

Use this guide to add custom, performance-critical native operations in C++ and expose them to TypeScript via React Native JSI.

---

## 🚦 Architectural Guidelines

Before writing any C++ code, ensure you adhere to the following principles:

1. **Amdahl's Law & Premature Optimization**:
   * Evaluate what percentage of total inference/pipeline time the processing step occupies. If the preprocessing/postprocessing step takes `< 5%` of the total inference budget, write it in **pure TypeScript** to reduce codebase complexity and maintenance overhead.

2. **Destination Tensors & Local Memory**:
   * **Local Memory is Allowed**: You can allocate temporary native C++ memory (such as stack variables, `std::vector`s, or dynamic memory cleaned up before the function exits) for intermediate calculations.
   * **Destination Tensors**: If the operation writes dense output, the destination tensor must be pre-allocated by the caller (in TypeScript) and passed as an argument (e.g., `sigmoid(src, dst)`).
   * **Primitive Array Returns**: If the operation produces variable-sized non-dense outputs (like bounding box indices in Non-Maximum Suppression (NMS)), return a plain `jsi::Array` of primitives (like indices or coordinates).
     * *Example*: `nms(boxes, scores, options)` returns a `jsi::Array` of indices (e.g., `[0, 4, 12]`) rather than a new tensor. This avoids all native memory management overhead for variable-sized outputs.

## 🚫 Avoid / Anti-Patterns

* **Do NOT return implicitly allocated JSI Tensors:** Never return newly created `TensorHostObject` instances from C++. This forces the JavaScript layer to reason about their garbage collection and manual lifetimes, leading to native memory leaks.
* **Do NOT define default parameters in C++:** Native C++ functions must never define default argument values (e.g. `axis = -1`). Define all default values explicitly in the TypeScript wrapper layer instead.
* **Do NOT perform in-place mutation without safety checks:** Never allow inputs and outputs to share the same underlying instance.

---

---

## 🛠️ Step-by-Step Implementation

### Step 1: Create the Native Operation Files
Under `cpp/extensions/<domain>/`, create or modify the header and implementation files for your operations:

#### 1. Header (`cpp/extensions/<domain>/operations.h`)
Keep the header clean and specify exact JSI install functions:
```cpp
#pragma once
#include <jsi/jsi.h>

namespace rnexecutorch::extensions::<domain>
{
    void install_customOp(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
}
```

#### 2. Source (`cpp/extensions/<domain>/operations.cpp`)
* Extract input and output tensors as `TensorHostObject` pointers.
* Check bounds, shapes, types, and verify that the output tensor is **not the same instance** as the input (no unsafely managed in-place mutation).
* Lock tensors using `std::shared_lock` (for inputs) and `std::unique_lock` (for outputs).

```cpp
#include "operations.h"
#include "core/tensor.h"
#include <algorithm>

namespace rnexecutorch::extensions::<domain>
{
    namespace jsi = facebook::jsi;
    using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

    void install_customOp(jsi::Runtime &rt, jsi::Object &module)
    {
        auto name = "customOp";
        auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value
        {
            // 1. Strict argument count validation (No default values here!)
            if (count != 3)
            {
                throw jsi::JSError(rt, "Usage: customOp(src, dst, factor)");
            }

            // 2. Validate input and output types
            auto srcObj = args[0].asObject(rt);
            auto dstObj = args[1].asObject(rt);
            if (!srcObj.isHostObject<TensorHostObject>(rt) || !dstObj.isHostObject<TensorHostObject>(rt))
            {
                throw jsi::JSError(rt, "customOp: Arguments src and dst must be Tensors");
            }

            auto src = srcObj.getHostObject<TensorHostObject>(rt);
            auto dst = dstObj.getHostObject<TensorHostObject>(rt);
            double factor = args[2].asNumber();

            // 3. Prevent in-place mutations
            if (src.get() == dst.get())
            {
                throw jsi::JSError(rt, "customOp: In-place operations (src == dst) are not supported.");
            }

            // 4. Validate metadata compatibility
            if (src->shape_ != dst->shape_ || src->dtype_ != dst->dtype_)
            {
                throw jsi::JSError(rt, "customOp: src and dst shape and dtype must match");
            }

            // 5. Lock underlying buffers
            std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
            std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
            if (!src_lock.owns_lock() || !dst_lock.owns_lock())
            {
                throw jsi::JSError(rt, "customOp: Tensors are currently in use");
            }

            if (!src->data_ || !dst->data_)
            {
                throw jsi::JSError(rt, "customOp: Tensor has been disposed");
            }

            // 6. Perform the computation
            const float *srcData = reinterpret_cast<const float *>(src->data_.get());
            float *dstData = reinterpret_cast<float *>(dst->data_.get());
            size_t size = src->size();

            for (size_t i = 0; i < size; ++i)
            {
                dstData[i] = srcData[i] * static_cast<float>(factor);
            }

            // Always return the destination tensor (args[1]) as the JSI result
            return jsi::Value(rt, args[1]);
        };

        module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
    }
}
```

---

### Step 2: Register in Extension and Core JSI Installs

1. **Extension Register** (`cpp/extensions/<domain>/install.cpp`):
   ```cpp
   #include "install.h"
   #include "operations.h"

   namespace rnexecutorch::extensions::<domain>
   {
       void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module)
       {
           facebook::jsi::Object subModule(rt);
           install_customOp(rt, subModule);
           module.setProperty(rt, "<domain>", subModule);
       }
   }
   ```

2. **Core Register** ([cpp/RnExecutorch.cpp](../cpp/RnExecutorch.cpp)):
   ```cpp
   #include "extensions/<domain>/install.h"
   // ... inside rnexecutorch::install ...
   rnexecutorch::extensions::<domain>::install(jsiRuntime, myModule);
   ```

---

### Step 3: TypeScript Bridge & Wrappers
Under `src/extensions/<domain>.ts` or `src/extensions/<domain>/index.ts`:
* **Use the `rnexecutorchJsi` Symbol**: You must import and interact with native bindings using the `rnexecutorchJsi` symbol exported from [src/native/bridge.ts](../src/native/bridge.ts). **Do not** reference the global `__rnexecutorch_jsi__` directly throughout your wrapper files.
* Expose the TypeScript wrapper.
* Handle default values here instead of the C++ layer.
* Mark wrapper functions with the `"worklet";` directive.

```typescript
import { rnexecutorchJsi } from '../native/bridge';
import { type Tensor } from '../core/tensor';

/**
 * Applies a custom operation scaling the src tensor by factor.
 * @param src Input Tensor.
 * @param dst Pre-allocated Destination Tensor.
 * @param factor Scale factor. Defaults to 1.0.
 */
export function customOp(src: Tensor, dst: Tensor, factor: number = 1.0): Tensor {
  'worklet';
  return rnexecutorchJsi.<domain>.customOp(src, dst, factor);
}
```

---

## 📋 Verification Checklist

When adding a native extension, verify that:
- [ ] You only implemented in C++ if the operation takes `> 5%` of the total inference budget.
- [ ] No JSI Tensors are implicitly allocated and returned in the C++ code.
- [ ] Input and output tensors are locked using `std::shared_lock` and `std::unique_lock` respectively.
- [ ] In-place mutation is explicitly prevented by checking that `src != dst`.
- [ ] No default parameter values are defined in the C++ header/source files.
- [ ] The custom operation install function is registered in both the domain `install` function and core [cpp/RnExecutorch.cpp](../cpp/RnExecutorch.cpp).
- [ ] The TypeScript wrapper imports and uses `rnexecutorchJsi` instead of the global `__rnexecutorch_jsi__`.
- [ ] The TypeScript wrapper is marked with the `"worklet";` directive and defines all default parameter values.
