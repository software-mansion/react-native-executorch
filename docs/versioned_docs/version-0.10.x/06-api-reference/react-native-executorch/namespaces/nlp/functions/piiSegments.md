# Function: piiSegments()

> **piiSegments**\<`Label`\>(`text`, `entities`): [`PiiSegment`](../type-aliases/PiiSegment.md)\<`Label`\>[]

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:503](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L503)

Splits `text` into an alternating sequence of plain runs and labeled entity
runs, ready to render (e.g. highlight each entity, leave plain runs alone)
without any client-side string matching.

Entities must come from the same input `text` (their `charStart`/`charEnd`
index into it) and must not overlap; the pipeline never emits overlapping
spans, so the typical case is passing `detectPii`'s result straight through.
Overlapping inputs are resolved first-wins by start position.

## Type Parameters

### Label

`Label` _extends_ `string`

## Parameters

### text

`string`

The original input the entities were detected in.

### entities

readonly [`PiiEntity`](../interfaces/PiiEntity.md)\<`Label`\>[]

Detected entity spans, in any order.

## Returns

[`PiiSegment`](../type-aliases/PiiSegment.md)\<`Label`\>[]

A flat list of plain and entity segments covering `text`.
