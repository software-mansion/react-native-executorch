# Type Alias: PersonKeypoints\<K\>

> **PersonKeypoints**\<`K`\> = `{ readonly [Name in keyof K]: Keypoint }`

Defined in: [types/poseEstimation.ts:25](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L25)

Keypoints for a single detected person, keyed by name from the keypoint map.

## Type Parameters

### K

`K` _extends_ [`LabelEnum`](LabelEnum.md) = _typeof_ [`CocoKeypoint`](../enumerations/CocoKeypoint.md)

The [LabelEnum](LabelEnum.md) for this model.

## Example

```ts
person.NOSE; // { x, y }
```
