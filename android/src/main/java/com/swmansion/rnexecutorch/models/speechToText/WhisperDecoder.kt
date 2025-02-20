package com.swmansion.rnexecutorch.models.speech_to_text

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class WhisperDecoder(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<EValue, Int>(reactApplicationContext) {
  private var generatedTokens: MutableList<Int> = mutableListOf()
//  private var encodingOutputShape = longArrayOf(1, )

  fun setGeneratedTokens(tokens: MutableList<Int>) {
    this.generatedTokens = tokens
  }

  override fun runModel(input: EValue): Int {
    val tokensEValue = EValue.from(Tensor.fromBlob(this.generatedTokens.toIntArray(), longArrayOf(1, generatedTokens.size.toLong())))
    return this.module
      .forward(tokensEValue, input)[0]
      .toTensor()
      .dataAsLongArray[0]
      .toInt()
  }

  override fun preprocess(input: EValue): EValue {
    // I am not doing the same thing as in the encoder here purposefully. The reason for that is that decoding
    // is ran A LOT of times. This would mean that with each decoding, we're doing that stupid
    // operation. So here we do nothing. Actually its a FIXME: fix this in the encoder as well
    TODO("Not yet implemented")
  }

  override fun postprocess(output: Array<EValue>): Int {
    TODO("Not yet implemented")
  }
}
