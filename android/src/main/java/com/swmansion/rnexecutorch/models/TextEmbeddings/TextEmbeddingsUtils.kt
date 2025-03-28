package com.swmansion.rnexecutorch.models.textEmbeddings

import kotlin.math.sqrt

class TextEmbeddingsUtils {
  companion object {
    fun meanPooling(
      modelOutput: DoubleArray,
      attentionMask: LongArray,
    ): DoubleArray {
      val attentionMaskLength = attentionMask.size
      val modelOutputLength = modelOutput.size
      val embeddingDim = modelOutputLength / attentionMaskLength

      val result = DoubleArray(embeddingDim)
      var sumMask = attentionMask.sum().toDouble()
      sumMask = maxOf(sumMask, 1e-9)

      for (i in 0 until embeddingDim) {
        var sum = 0.0
        for (j in 0 until attentionMaskLength) {
          sum += modelOutput[j * embeddingDim + i] * attentionMask[j]
        }
        result[i] = sum / sumMask
      }

      return result
    }

    fun normalize(embeddings: DoubleArray): DoubleArray {
      var sum = embeddings.sumOf { it * it }
      sum = maxOf(sqrt(sum), 1e-9)

      return embeddings.map { it / sum }.toDoubleArray()
    }
  }
}
