# Type Alias: KeypointDetection\<F, L\>

> **KeypointDetection**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/keypointDetection.ts:102](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L102)

Result structure representing a single detected bounding box and its
associated landmarks.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

### L

`L` _extends_ `PropertyKey`

## Properties

### box

> `readonly` **box**: [`BoundingBox`](../react-native-executorch/namespaces/cv/type-aliases/BoundingBox.md)\<`F`\>

Defined in: [extensions/cv/tasks/keypointDetection.ts:104](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L104)

Scaled bounding box coordinates matching the input image resolution.

---

### confidence

> `readonly` **confidence**: `number`

Defined in: [extensions/cv/tasks/keypointDetection.ts:110](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L110)

Overall confidence score of the detection (between 0.0 and 1.0). When
several boxes are merged by NMS, this is the highest score in the merged
group, so it does not depend on how many low-scoring boxes were absorbed.

---

### landmarks

> `readonly` **landmarks**: [`Landmarks`](Landmarks.md)\<`L`\>

Defined in: [extensions/cv/tasks/keypointDetection.ts:112](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L112)

Map of landmark names to their scaled pixel coordinates and individual confidence scores.
