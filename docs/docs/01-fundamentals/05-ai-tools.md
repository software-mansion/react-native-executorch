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
handle native resources, and verify model behavior. It uses the same distribution approach as the
TypeGPU skill in the [Software Mansion skills repository](https://github.com/software-mansion-labs/skills).

The React Native ExecuTorch skill is being prepared for that repository. Once published, install it with:

```bash
npx skills add software-mansion-labs/skills -s react-native-executorch
```

Until it is published, give your agent the versioned documentation links below. The skill is optional;
the library and its documentation work independently of skill installation.

## Select the documentation version

Inspect the version installed in the application, including its lockfile. Documentation is organized by
release line, not by every npm patch:

- `/react-native-executorch/docs/...` is the **default released line**, selected by the site's version menu.
- `/react-native-executorch/docs/next/...` is **Next**, the unreleased development documentation.
- `/react-native-executorch/docs/<release-line>/...` contains older snapshots, for example `0.10.x`.

Use the version menu or the [agent documentation index](https://docs.swmansion.com/react-native-executorch/llms.txt) to find the
matching line. The default line changes as releases advance. Do not combine an older installed package
with examples from Next, or assume a development checkout's package version is the current npm release.

## Markdown and focused context

Each documentation page, including API reference pages, has a Markdown representation. Append `.md`
to its URL, keeping the version segment. For example:

```text
https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started.md
https://docs.swmansion.com/react-native-executorch/docs/next/fundamentals/getting-started.md
```

Use **Copy Page → View Markdown** for the page you are reading. The
[root index](https://docs.swmansion.com/react-native-executorch/llms.txt) links the default release, Next and historical
documentation. Start with a relevant guide and fetch API details as needed.

## A prompt to start with

```text
Help me build with react-native-executorch. First inspect my installed package version,
React Native/Expo setup, and target platform, then use the matching documentation.
Determine whether a pre-exported model and task hook fits my goal. If I have a custom
PyTorch or .pte model, inspect its input/output contract and choose either an existing
task or a custom TypeScript pipeline. Verify export/runtime/backend compatibility,
resource cleanup, and a representative inference result on the target device.
```

For a custom model, provide its PyTorch definition or exported `.pte`, sample inputs and expected
outputs, preprocessing/tokenizer assets, and target devices. Use
[ExecuTorch Export Recipes](https://github.com/software-mansion-labs/executorch-export-recipes) and its
agent skills for the export step, then follow
[Exporting Custom Models](../03-core-and-advanced/07-exporting-custom-models.md) to integrate and verify
the result in your app.
