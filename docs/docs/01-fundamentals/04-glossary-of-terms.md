# Glossary of Terms

This glossary defines key concepts used throughout the React Native ExecuTorch ecosystem, covering high-level machine learning terms and library-specific components.

## Backend

The execution engine responsible for running the actual computations of a model on specific hardware.

- **XNNPACK:** A highly optimized library for floating-point neural network inference on ARM, x86, and WebAssembly. It is the default CPU backend for ExecuTorch.

- **Core ML:** Apple's framework for optimizing and running machine learning models on iOS, macOS, and iPadOS devices. Using the Core ML backend allows ExecuTorch to delegate operations to the Apple Neural Engine (ANE) for significantly faster and more energy-efficient inference.

## Forward Function

The primary method of a PyTorch module (usually `forward()`) that defines the computation performed at every call. In the context of ExecuTorch, this is the logic that gets exported and compiled. When you run inference in React Native, you are essentially invoking this compiled forward function with new inputs.

## Inference

The process of using a trained machine learning model to make predictions or generate outputs based on new, unseen input data. Unlike training (which updates the model's weights), inference is static and computationally lighter, making it suitable for running directly on mobile devices.

## Out-of-the-Box Support

Refers to features, models, or architectures that work immediately with React Native ExecuTorch without requiring custom compilation, manual kernel registration, or complex configuration. For example, standard Llama architectures have out-of-the-box support, meaning you can download the `.pte` file and run it instantly.

## Prefill

The initial phase of generating text with an LLM (Large Language Model) where the model processes the entire input prompt (context) at once.

- **Why it matters:** This step is computationally intensive because the model must "understand" all provided tokens simultaneously.

- **Performance Metric:** "Time to First Token" (TTFT) usually measures the speed of the prefill phase.

## Quantization

A technique to reduce the size of a model and speed up inference by representing weights and activations with lower-precision data types (e.g., converting 32-bit floating-point numbers to 8-bit integers).

- **Benefits:** Drastically lowers memory usage (RAM) and saves battery life on mobile devices.

- **Trade-off:** Slight reduction in model accuracy, though often negligible for deployment.

## Tensor

The fundamental data structure in PyTorch and ExecuTorch. A tensor is a multi-dimensional array (like a matrix) that holds the inputs, weights, and outputs of a model.

- **Example:** An image might be represented as a tensor of shape `[3, 224, 224]` (3 color channels, 224 pixels high, 224 pixels wide).

## Token

The basic unit of text that an LLM reads and generates. A token can be a word, part of a word, or even a single character.

- **Rule of thumb:** 1,000 tokens is roughly equivalent to 750 words in English.

- **Context:** Models have a "Context Window" limit (e.g., 2048 tokens), which is the maximum number of tokens they can remember from the conversation history.

## Tokenization

The process of converting raw text (strings) into a sequence of numerical IDs (tokens) that the model can understand.

- **Tokenizer (Component):** In React Native ExecuTorch, the `Tokenizer` is a utility class that handles encoding text into tensors and decoding output tensors back into readable text strings.
