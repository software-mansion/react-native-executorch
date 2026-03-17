import { LabelEnum } from './common';

/**
 * Given a model configs record (mapping model names to `{ labelMap }`) and a
 * type `T` (either a model name key or a raw {@link LabelEnum}), resolves to
 * the label map for that model or `T` itself.
 *
 * @internal
 */
export type ResolveLabels<
  T,
  Configs extends Record<string, { labelMap: LabelEnum }>,
> = T extends keyof Configs
  ? Configs[T]['labelMap']
  : T extends LabelEnum
    ? T
    : never;
