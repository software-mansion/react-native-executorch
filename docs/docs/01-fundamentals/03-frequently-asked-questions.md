---
title: Frequently Asked Questions
---

This section is meant to answer some common community inquiries, especially regarding the ExecuTorch runtime or adding your own models. If you can't see an answer to your question, feel free to open up a [discussion](https://github.com/software-mansion/react-native-executorch/discussions/new/choose).

### What models are supported?

Each hook documentation subpage (useClassification, useLLM, etc.) contains a supported models section, which lists the models that are runnable within the library with close to no setup. For running your custom models, refer to `ExecuTorchModule` or `useExecuTorchModule`.

### How can I run my own AI model?

To run your own model, you need to directly access the underlying [ExecuTorch Module API](https://pytorch.org/executorch/stable/extension-module.html). We provide an experimental [React hook](../03-hooks/03-executorch-bindings/useExecutorchModule.md) along with a [TypeScript alternative](../04-typescript-api/03-executorch-bindings/ExecutorchModule.md), which serve as a way to use the aforementioned API without the need of diving into native code. In order to get a model in a format runnable by the runtime, you'll need to get your hands dirty with some ExecuTorch knowledge. For more guides on exporting models, please refer to the [ExecuTorch tutorials](https://pytorch.org/executorch/stable/tutorials/export-to-executorch-tutorial.html). Once you obtain your model in a `.pte` format, you can run it with `useExecuTorchModule` and `ExecuTorchModule`.

### Can you do function calling with useLLM?

If your model supports tool calling (i.e. its chat template can process tools) you can use the method explained on the [useLLM page](../03-hooks/01-natural-language-processing/useLLM.md).

If your model doesn't support it, you can still work around it using context. For details, refer to [this comment](https://github.com/software-mansion/react-native-executorch/issues/173#issuecomment-2775082278).

### Can I use React Native ExecuTorch in bare React Native apps?

To use the library, you need to install Expo Modules first. For a setup guide, refer to [this tutorial](https://docs.expo.dev/bare/installing-expo-modules/). This is because we use Expo File System under the hood to download and manage the model binaries.

### Do you support the old architecture?

The old architecture is not supported and we're currently not planning to add support.

### Can I run GGUF models using the library?

No, as of now ExecuTorch runtime doesn't provide a reliable way to use GGUF models, hence it is not possible.

### Are the models leveraging GPU acceleration?

While it is possible to run some models using Core ML on iOS, which is a backend that utilizes CPU, GPU and ANE, we currently don't have many models exported to Core ML. For Android, the current state of GPU acceleration is pretty limited. As of now, there are attempts of running the models using a Vulkan backend. However the operator support is very limited meaning that the resulting performance is often inferior to XNNPACK. Hence, most of the models use XNNPACK, which is a highly optimized and mature CPU backend that runs on both Android and iOS.

### Does this library support XNNPACK and Core ML?

Yes, all of the backends are linked, therefore the only thing that needs to be done on your end is to export the model with the backend that you're interested in using.
