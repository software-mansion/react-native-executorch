# Interface: VADStreamingOptions

Defined in: [types/vad.ts:51](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L51)

Configuration options for the VAD streaming process.

## Properties

### detectionMargin?

> `optional` **detectionMargin**: `number`

Defined in: [types/vad.ts:53](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L53)

Specifies (in milliseconds) how far the last detected speech segment can be to still be considered as ongoing speech.

---

### timeout?

> `optional` **timeout**: `number`

Defined in: [types/vad.ts:52](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L52)

Specifies (in milliseconds) how much does streamer wait between model inferences.
