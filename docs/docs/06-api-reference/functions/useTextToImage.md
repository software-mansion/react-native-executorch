# Function: useTextToImage()

> **useTextToImage**(`__namedParameters`): `TextToImageType`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useTextToImage.ts:21](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/hooks/computer_vision/useTextToImage.ts#L21)

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
