# Type Alias: PiiSegment\<Label\>

> **PiiSegment**\<`Label`\> = \{ `kind`: `"plain"`; `text`: `string`; \} \| \{ `kind`: `"entity"`; `label`: `Label`; `text`: `string`; \}

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:485](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L485)

One run in a segmentation of source text: either a plain (uncovered) run or
a labeled entity slice. Adjacent segments cover the input without gaps or
overlaps; concatenating every `text` reproduces the input.

## Type Parameters

### Label

`Label` _extends_ `string` = `string`

The entity label type; narrows to a specific model's
entity types when known, or `string` for an arbitrary model.
