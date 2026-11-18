---
title: AI Tools
slug: /fundamentals/ai-tools
description: 'Use React Native ExecuTorch with a coding agent: choose ready-to-use models and hooks, bring your own .pte, and retrieve documentation for the installed version.'
---

# AI Tools

React Native ExecuTorch gives your coding agent two starting points:

- **Use a ready-made task.** Choose a [pre-exported model](./04-supported-models.md) and a task hook
  for chat, vision, speech or embeddings. The task handles model loading, preprocessing, inference
  and postprocessing; the hook manages downloads and React lifecycle.
- **Bring your own model.** [Export a compatible `.pte`](../03-core-and-advanced/07-exporting-custom-models.md),
  inspect its schema, and reuse a built-in task if its contract fits. Otherwise build a custom
  TypeScript pipeline using [models and tensors](../03-core-and-advanced/02-models-and-tensors.md),
  [schema validation](../03-core-and-advanced/03-schema-validation.md) and
  [worklets](../03-core-and-advanced/06-worklets-and-threading.md).

These paths use the same runtime. You can start with a shipped model and replace it with your own
without rewriting the application when the input/output contract stays compatible.

## Consumer skill

The consumer skill teaches an agent how to choose between these paths, prepare a React Native app,
handle native resources, and verify model behavior. Install it from the
[Software Mansion skills repository](https://github.com/software-mansion-labs/skills).

```bash
npx skills add software-mansion-labs/skills -s react-native-executorch
```

The skill is optional; the library and its documentation work independently of skill installation.

For existing apps, use documentation matching the installed react-native-executorch version.

## A prompt to start with

> Create a new React Native app using the latest stable react-native-executorch release and its
> matching documentation. Help me build [describe the feature]. Choose a pre-exported model and task
> hook if one fits; otherwise use
> [ExecuTorch Export Recipes](https://github.com/software-mansion-labs/executorch-export-recipes)
> to export my custom model and build the mobile pipeline. Configure the required native dependencies
> and verify inference on the target device.

For a custom model, provide its PyTorch definition or exported `.pte`, sample inputs and expected
outputs, preprocessing/tokenizer assets, and target devices. Use
[ExecuTorch Export Recipes](https://github.com/software-mansion-labs/executorch-export-recipes) and its
agent skills for the export step, then follow
[Exporting Custom Models](../03-core-and-advanced/07-exporting-custom-models.md) to integrate and verify
the result in your app.
