package com.swmansion.rnexecutorch.models.textEmbeddings

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import org.pytorch.executorch.HuggingFaceTokenizer
import org.pytorch.executorch.Tensor
import java.net.URL

class TextEmbeddingsModel(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<String, DoubleArray>(reactApplicationContext) {
  private lateinit var tokenizer: HuggingFaceTokenizer

  fun loadTokenizer(tokenizerSource: String) {
    tokenizer = HuggingFaceTokenizer(URL(tokenizerSource).path)
  }

  fun preprocess(input: String): Array<LongArray> {
    val inputIds = tokenizer.encode(input).map { it.toLong() }.toLongArray()
    val attentionMask = inputIds.map { if (it != 0L) 1L else 0L }.toLongArray()
    return arrayOf(inputIds, attentionMask) // Shape: [2, max_length]
  }

  fun postprocess(
    modelOutput: FloatArray, // [max_length * embedding_dim]
    attentionMask: LongArray, // [max_length]
  ): DoubleArray {
    val modelOutputDouble = modelOutput.map { it.toDouble() }.toDoubleArray()
    val embeddings = TextEmbeddingsUtils.meanPooling(modelOutputDouble, attentionMask)
    return TextEmbeddingsUtils.normalize(embeddings)
  }

  override fun runModel(input: String): DoubleArray {
    val modelInput = preprocess(input)
    val inputsIds = modelInput[0]
    val attentionMask = modelInput[1]

    val inputsIdsShape = longArrayOf(1, inputsIds.size.toLong())
    val attentionMaskShape = longArrayOf(1, attentionMask.size.toLong())

    val inputIdsEValue = EValue.from(Tensor.fromBlob(inputsIds, inputsIdsShape))
    val attentionMaskEValue = EValue.from(Tensor.fromBlob(attentionMask, attentionMaskShape))

    val modelOutput = forward(inputIdsEValue, attentionMaskEValue)[0].toTensor().dataAsFloatArray

    return postprocess(modelOutput, attentionMask)
  }
}
