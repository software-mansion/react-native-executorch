package com.swmansion.rnexecutorch.models.ocr

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.models.ocr.utils.RecognizerUtils
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Size
import org.pytorch.executorch.EValue

class Recognizer(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<Mat, Pair<List<Int>, Double>>(reactApplicationContext) {
  private fun getModelOutputSize(): Size {
    val outputShape = module.getOutputShape(0)
    val width = outputShape[outputShape.lastIndex]
    val height = outputShape[outputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  override fun preprocess(input: Mat): EValue = ImageProcessor.matToEValueGray(input)

  override fun postprocess(output: Array<EValue>): Pair<List<Int>, Double> {
    val modelOutputHeight = getModelOutputSize().height.toInt()
    val tensor = output[0].toTensor().dataAsFloatArray
    val numElements = tensor.size
    val numRows = (numElements + modelOutputHeight - 1) / modelOutputHeight
    val resultMat = Mat(numRows, modelOutputHeight, org.opencv.core.CvType.CV_32F)
    var counter = 0
    var currentRow = 0
    for (num in tensor) {
      resultMat.put(currentRow, counter, floatArrayOf(num))
      counter++
      if (counter >= modelOutputHeight) {
        counter = 0
        currentRow++
      }
    }

    var probabilities = RecognizerUtils.softmax(resultMat)
    val predsNorm = RecognizerUtils.sumProbabilityRows(probabilities, modelOutputHeight)
    probabilities = RecognizerUtils.divideMatrixByVector(probabilities, predsNorm)
    val (values, indices) = RecognizerUtils.findMaxValuesAndIndices(probabilities)

    val confidenceScore = RecognizerUtils.computeConfidenceScore(values, indices)
    return Pair(indices, confidenceScore)
  }

  override fun runModel(input: Mat): Pair<List<Int>, Double> = postprocess(module.forward(preprocess(input)))
}
