package com.swmansion.rnexecutorch.models.imagesegmentation

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ImageProcessor
import com.swmansion.rnexecutorch.utils.softmax
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import org.pytorch.executorch.EValue

class ImageSegmentationModel(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<Triple<Mat, ReadableArray, Boolean>, WritableMap>(reactApplicationContext) {
  private lateinit var originalSize: Size

  private fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  fun preprocess(input: Mat): EValue {
    originalSize = input.size()
    Imgproc.resize(input, input, getModelImageSize())
    return ImageProcessor.matToEValue(input, module.getInputShape(0))
  }

  private fun extractResults(
    result: Array<Float>,
    numLabels: Int,
    resize: Boolean,
  ): List<Mat> {
    val modelSize = getModelImageSize()
    val numModelPixels = (modelSize.height * modelSize.width).toInt()

    val extractedLabelScores = mutableListOf<Mat>()

    for (label in 0..<numLabels) {
      val mat = Mat(modelSize, CvType.CV_32F)

      for (pixel in 0..<numModelPixels) {
        val row = pixel / modelSize.width.toInt()
        val col = pixel % modelSize.width.toInt()
        val v = floatArrayOf(result[label * numModelPixels + pixel])
        mat.put(row, col, v)
      }

      if (resize) {
        val resizedMat = Mat()
        Imgproc.resize(mat, resizedMat, originalSize)
        extractedLabelScores.add(resizedMat)
      } else {
        extractedLabelScores.add(mat)
      }
    }
    return extractedLabelScores
  }

  private fun adjustScoresPerPixel(
    labelScores: List<Mat>,
    numLabels: Int,
    outputSize: Size,
  ): Mat {
    val argMax = Mat(outputSize, CvType.CV_32S)
    val numPixels = (outputSize.height * outputSize.width).toInt()
    for (pixel in 0..<numPixels) {
      val row = pixel / outputSize.width.toInt()
      val col = pixel % outputSize.width.toInt()
      val scores = mutableListOf<Float>()
      for (mat in labelScores) {
        scores.add(mat.get(row, col)[0].toFloat())
      }
      val adjustedScores = softmax(scores.toTypedArray())
      for (label in 0..<numLabels) {
        labelScores[label].put(row, col, floatArrayOf(adjustedScores[label]))
      }

      val maxIndex = scores.withIndex().maxBy { it.value }.index
      argMax.put(row, col, intArrayOf(maxIndex))
    }

    return argMax
  }

  fun postprocess(
    output: Array<EValue>,
    classesOfInterest: ReadableArray,
    resize: Boolean,
  ): WritableMap {
    val output = output[0].toTensor().dataAsFloatArray.toTypedArray()
    val modelSize = getModelImageSize()
    val numLabels = deeplabv3_resnet50_labels.size

    require(output.count() == (numLabels * modelSize.height * modelSize.width).toInt()) { "Model generated unexpected output size." }

    val outputSize = if (resize) originalSize else modelSize
    val numOutputPixels = (outputSize.height * outputSize.width).toInt()

    val extractedResults = extractResults(output, numLabels, resize)

    val argMax = adjustScoresPerPixel(extractedResults, numLabels, outputSize)

    val labelSet = mutableSetOf<String>()
    // Filter by the label set when base class changed
    for (i in 0..<classesOfInterest.size()) {
      labelSet.add(classesOfInterest.getString(i))
    }

    val res = Arguments.createMap()

    for (label in 0..<numLabels) {
      if (labelSet.contains(deeplabv3_resnet50_labels[label])) {
        val buffer = FloatArray(numOutputPixels)
        for (pixel in 0..<numOutputPixels) {
          val row = pixel / outputSize.width.toInt()
          val col = pixel % outputSize.width.toInt()
          buffer[pixel] = extractedResults[label].get(row, col)[0].toFloat()
        }
        res.putArray(
          deeplabv3_resnet50_labels[label],
          ArrayUtils.createReadableArrayFromFloatArray(buffer),
        )
      }
    }

    val argMaxBuffer = IntArray(numOutputPixels)
    for (pixel in 0..<numOutputPixels) {
      val row = pixel / outputSize.width.toInt()
      val col = pixel % outputSize.width.toInt()
      argMaxBuffer[pixel] = argMax.get(row, col)[0].toInt()
    }
    res.putArray(
      "argmax",
      ArrayUtils.createReadableArrayFromIntArray(argMaxBuffer),
    )

    return res
  }

  override fun runModel(input: Triple<Mat, ReadableArray, Boolean>): WritableMap {
    val modelInput = preprocess(input.first)
    val modelOutput = forward(modelInput)
    return postprocess(modelOutput, input.second, input.third)
  }
}
