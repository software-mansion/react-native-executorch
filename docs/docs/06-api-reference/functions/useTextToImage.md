# Function: useTextToImage()

> **useTextToImage**(`__namedParameters`): `TextToImageType`

Defined in: [packages/react-native-executorch/src/hooks/computer_vision/useTextToImage.ts:21](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/hooks/computer_vision/useTextToImage.ts#L21)

## Parameters

### \_\_namedParameters

#### inferenceCallback?

(`stepIdx`) => `void`

#### model

\{ `decoderSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); `encoderSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); `schedulerSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); `tokenizerSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); `unetSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); \}

#### model.decoderSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### model.encoderSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### model.schedulerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### model.tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### model.unetSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

#### preventLoad?

`boolean` = `false`

## Returns

`TextToImageType`
