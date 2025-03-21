package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class WhisperDecoder(
  reactApplicationContext: ReactApplicationContext,
) : BaseS2TDecoder(reactApplicationContext) {
  private lateinit var generatedTokens: IntArray
  override var methodName: String = "forward"

  override fun setGeneratedTokens(tokens: ReadableArray) {
    this.generatedTokens = ArrayUtils.createIntArray(tokens)
  }

  override fun getTokensEValue(): EValue = EValue.from(Tensor.fromBlob(this.generatedTokens, longArrayOf(1, generatedTokens.size.toLong())))

  override fun getInputShape(inputLength: Int): LongArray = longArrayOf(1, 1500, 384)
}
