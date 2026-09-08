# Type Alias: PiiEntityType\<Label\>

> **PiiEntityType**\<`Label`\> = `Label` _extends_ \`$\{"B" \| "I" \| "E" \| "S"\}-$\{infer Entity\}\` ? `Entity` : `never`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:48](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L48)

The bare entity type carried by a BIOES label space: everything after the
`B-`/`I-`/`E-`/`S-` prefix (`'O'` and any unprefixed label contribute
nothing). Lets a model's concrete label list narrow [PiiEntity.label](../interfaces/PiiEntity.md#label-1)
to just that model's entity types instead of an arbitrary string.

## Type Parameters

### Label

`Label` _extends_ `string`
