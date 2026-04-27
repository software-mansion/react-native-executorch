import { LabelEnum } from './common';

/*
 * Automatically resolves the type to either Configs[NameOrType][OutputKey], if the NameOrType
 * is a key of Configs. Otherwise, returns NameOrType.
 * @internal
 */
export type ResolveConfigOrType<
  NameOrType,
  Configs extends Record<string, Record<OutputKey, unknown>>,
  OutputKey extends string = 'output',
> = NameOrType extends keyof Configs
  ? Configs[NameOrType][OutputKey]
  : NameOrType;

/**
 * Given a model configs record (mapping model names to `{ labelMap }`) and a
 * type `T` (either a model name key or a raw {@link LabelEnum}), resolves to
 * the label map for that model or `T` itself.
 * @internal
 */
export type ResolveLabels<
  NameOrLabels,
  Configs extends Record<string, { labelMap: LabelEnum }>,
> = ResolveConfigOrType<NameOrLabels, Configs, 'labelMap'>;
