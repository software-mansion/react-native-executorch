# Compatibility

## New Architecture (Fabric)[​](#new-architecture-fabric "Direct link to New Architecture (Fabric)")

React Native ExecuTorch supports only the [New Architecture](https://reactnative.dev/architecture/landing-page) of React Native.

## react-native-executorch[​](#react-native-executorch "Direct link to react-native-executorch")

| React Native ExecuTorch | React Native version |      |      |      |      |      |      |      |           |
| ----------------------- | -------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | --------- |
|                         | 0.78                 | 0.79 | 0.80 | 0.81 | 0.82 | 0.83 | 0.84 | 0.85 | 0.86      |
| 0.8.x                   | no                   | no   | no   | yes  | yes  | yes  | yes  | yes  | untested† |
| 0.9.x                   | no                   | no   | no   | yes  | yes  | yes  | yes  | yes  | untested† |
| 0.10.x                  | no                   | no   | no   | no\* | no\* | yes  | yes  | yes  | yes       |

**\*** `react-native-executorch` 0.10 needs `react-native-worklets` `>=0.10.0 <0.13.0`, and worklets 0.10 is the first release to serialize an `ArrayBufferView` natively ([reanimated #9475](https://github.com/software-mansion/react-native-reanimated/pull/9475)); older ones rebuild the view over its whole backing buffer, losing `byteOffset` and `length`. Worklets 0.10 in turn requires React Native 0.83+, which is what rules out 0.81 and 0.82.

**†** Not verified. 0.8.x and 0.9.x were released before React Native 0.86 and are maintained on the `legacy` dist-tag only.

## Expo SDK[​](#expo-sdk "Direct link to Expo SDK")

`npx expo install` picks the `react-native-worklets` an SDK bundles, which is older than this library needs on SDK 55 and 56. Both work once you ask for the versions below explicitly — Reanimated pins worklets exactly, so it moves with it.

| Expo SDK | React Native | Bundled worklets | react-native-executorch 0.10.x |
| -------- | ------------ | ---------------- | ------------------------------ |
| 54       | 0.81         | 0.5.1            | no                             |
| 55       | 0.83         | 0.7.4            | needs explicit versions        |
| 56       | 0.85         | 0.8.3            | needs explicit versions        |
| 57       | 0.86         | 0.10.1           | yes                            |

On SDK 55 and 56, install both:

```bash
npm install react-native-worklets@^0.10.0 react-native-reanimated@^4.5.0

```

SDK 54 is React Native 0.81, below what worklets 0.10 accepts, so no combination of versions works there.
