---
title: Frequently asked questions
sidebar_position: 1
---

This section is meant to answer some common community inquiries, expecially regarding the ExecuTorch runtime or adding your own models. If there is no answer to your question, feel free to open up a [discussion](https://github.com/software-mansion/react-native-executorch/discussions/new/choose).

### Can I use React Native ExecuTorch in bare React Native apps?

To use the library, you need to install Expo Modules first. For a setup guide, refer to [this tutorial](https://docs.expo.dev/bare/installing-expo-modules/). This is because we use Expo FS under the hood to download and manage the model binaries.

### Do you support the old architecture?

No, we don't and adding support is not planned.

### Can I run GGUF models using the library?

No, currently ExecuTorch runtime doesn't provide a reliable way to use GGUF models, hence we don't support it.

### How can I run my own AI model?

To run your own model, you need to directly access the underlying [ExecuTorch Module API](https://pytorch.org/executorch/stable/extension-module.html). We provide an experimental [React hook](../executorch-bindings/useExecutorchModule.md) along with a [TypeScript alternative](../typescript-api/ExecutorchModule.md), which serve as a way to use the aformentioned API from our library. To run your model, you also need a `.pte` file. In order to get that file, you'll need to get your hands dirty with some ExecuTorch knowledge. For more guides on exporting models, please refer to the [ExecuTorch tutorials](https://pytorch.org/executorch/stable/tutorials/export-to-executorch-tutorial.html). Once you obtain your model in a `.pte` format, you can run it with `useExecuTorchModule` and `ExecuTorchModule`.

### Are the models leveraging GPU acceleration?

While it is possible to run some models using CoreML on iOS, which is a backend that utilizes CPU, GPU and ANE, we currently don't have much models exported to CoreML. For Android, the current state of GPU acceleration is pretty limited. As of now, there are attempts of running the models using a Vulkan backend. However the operator support is very limited meaning that it's not really bringing much befenits. Hence, most of the models are using XNNPack backend, which is a highly optimized and mature CPU backend.

### Does this library support XNNPack and CoreML?

Yes, it does. All of the backends are linked, therefore the only thing that needs to be done on your end is to export the model with the backend that you're interested in using.

### Can you do function calling with useLLM?

We currently don't provide an out-of-the-box solution for function calling, but modifying system prompts for Llama models should be enough for simple use cases. For more details, refer to [this comment](https://github.com/software-mansion/react-native-executorch/issues/173#issuecomment-2775082278)
