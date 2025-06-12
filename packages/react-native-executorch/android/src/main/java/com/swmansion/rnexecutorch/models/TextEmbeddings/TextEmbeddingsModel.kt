package com.swmansion.rnexecutorch.models.textEmbeddings

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import org.pytorch.executorch.HuggingFaceTokenizer
import org.pytorch.executorch.Tensor

class TextEmbeddingsModel(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<String, DoubleArray>(reactApplicationContext) {
  private lateinit var tokenizer: HuggingFaceTokenizer

  fun loadTokenizer(tokenizerSource: String) {
    tokenizer = HuggingFaceTokenizer(tokenizerSource)
  }

  fun preprocess(input: String): Array<LongArray> {
    val inputIds = tokenizer.encode(input).map { it.toLong() }.toLongArray()
    val attentionMask = inputIds.map { if (it != 0L) 1L else 0L }.toLongArray()
    return arrayOf(inputIds, attentionMask) // Shape: [2, tokens]
  }

  fun postprocess(
    modelOutput: FloatArray, // [tokens * embedding_dim]
    attentionMask: LongArray, // [tokens]
    meanPooling: Boolean,
  ): DoubleArray {
    var embeddings = modelOutput.map { it.toDouble() }.toDoubleArray()
    if (meanPooling) {
      embeddings = TextEmbeddingsUtils.meanPooling(embeddings, attentionMask)
    }
    embeddings = TextEmbeddingsUtils.normalize(embeddings)
    return embeddings
  }

  override fun runModel(input: String): DoubleArray {
    return runModel(input, true)
  }

  fun runModel(
    input: String,
    meanPooling: Boolean,
  ): DoubleArray {
    val modelInput = preprocess(input)
    val inputsIds = modelInput[0]
    val attentionMask = modelInput[1]

    val inputsIdsShape = longArrayOf(1, inputsIds.size.toLong())
    val attentionMaskShape = longArrayOf(1, attentionMask.size.toLong())

    val inputIdsEValue = EValue.from(Tensor.fromBlob(inputsIds, inputsIdsShape))
    val attentionMaskEValue = EValue.from(Tensor.fromBlob(attentionMask, attentionMaskShape))

    val modelOutput = forward(inputIdsEValue, attentionMaskEValue)[0].toTensor().dataAsFloatArray

    return postprocess(modelOutput, attentionMask, meanPooling)
  }
}
