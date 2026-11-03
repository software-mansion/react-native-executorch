# Ready-made models and tasks

Use a pre-exported model and task hook when its quality, input/output contract and supported devices
fit the user's goal. For a different model or task, read [custom-models.md](custom-models.md).

## Choose a model and integration

1. Read [Supported Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/supported-models)
   for the app's release. Check languages, modalities, license, assets, device benchmarks and memory needs.
2. Select a configuration from the installed `models` registry. Inspect available variants and required
   backends rather than copying a model identifier from another release.
3. Follow the selected task's guide and [API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference)
   for its hook, configuration and inference methods. Use a hook in React components; use the documented
   factory and download helpers when execution or lifetime is managed outside React.
4. Handle loading, errors and cancellation. Serialize calls that share a session or scratch buffers,
   and wait for active execution to stop before disposing imperative resources.

The catalog spans language and vision-language models, vision, speech, embeddings and retrieval.
Choose from the current catalog rather than assuming that a task or backend exists in every release.

## Respect the task's input contract

- **Vision:** distinguish compressed image files from decoded pixel buffers and camera frames.
  Follow the task's image layout, color, orientation and preprocessing requirements. Use the documented
  [camera integration](https://docs.swmansion.com/react-native-executorch/docs/extensions/camera-integration)
  for frame handling.
- **Speech:** distinguish encoded audio containers from decoded samples. Check channel count,
  sample rate and streaming lifecycle for the chosen pipeline.
- **Language models:** follow the
  [chat and generation guide](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation)
  for session management, streaming, history and cancellation. Tool use and multimodal capabilities
  depend on the chosen model and assets.
- **Embeddings:** keep query and document vectors in the same model/vector space and follow its
  pooling, normalization and prompt conventions. Decide separately how to persist a vector index.

For custom configurations, match preprocessing, auxiliary assets and output semantics as well as tensor
shapes. Reconcile a mismatch or build a custom pipeline; do not disable schema validation to force a fit.
