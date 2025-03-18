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
    result: FloatArray,
    numLabels: Int,
    resize: Boolean,
  ): List<FloatArray> {
    val modelSize = getModelImageSize()
    val numModelPixels = (modelSize.height * modelSize.width).toInt()

    val extractedLabelScores = mutableListOf<FloatArray>()

    for (label in 0..<numLabels) {
      // Calls to OpenCV via JNI are very slow so we do as much as we can
      // with pure Kotlin
      val range = IntRange(label * numModelPixels, (label + 1) * numModelPixels - 1)
      val pixelBuffer = result.slice(range).toFloatArray()

      if (resize) {
        // Rescale the image with OpenCV
        val mat = Mat(modelSize, CvType.CV_32F)
        mat.put(0, 0, pixelBuffer)
        val resizedMat = Mat()
        Imgproc.resize(mat, resizedMat, originalSize)
        val resizedBuffer = FloatArray((originalSize.height * originalSize.width).toInt())
        resizedMat.get(0, 0, resizedBuffer)
        extractedLabelScores.add(resizedBuffer)
      } else {
        extractedLabelScores.add(pixelBuffer)
      }
    }
    return extractedLabelScores
  }

  private fun adjustScoresPerPixel(
    labelScores: List<FloatArray>,
    numLabels: Int,
    outputSize: Size,
  ): IntArray {
    val numPixels = (outputSize.height * outputSize.width).toInt()
    val argMax = IntArray(numPixels)
    for (pixel in 0..<numPixels) {
      val scores = mutableListOf<Float>()
      for (buffer in labelScores) {
        scores.add(buffer[pixel])
      }
      val adjustedScores = softmax(scores.toTypedArray())
      for (label in 0..<numLabels) {
        labelScores[label][pixel] = adjustedScores[label]
      }

      val maxIndex = scores.withIndex().maxBy { it.value }.index
      argMax[pixel] = maxIndex
    }

    return argMax
  }

  fun postprocess(
    output: Array<EValue>,
    classesOfInterest: ReadableArray,
    resize: Boolean,
  ): WritableMap {
    val outputData = output[0].toTensor().dataAsFloatArray
    val modelSize = getModelImageSize()
    val numLabels = deeplabv3_resnet50_labels.size

    require(outputData.count() == (numLabels * modelSize.height * modelSize.width).toInt()) { "Model generated unexpected output size." }

    val outputSize = if (resize) originalSize else modelSize

    val extractedResults = extractResults(outputData, numLabels, resize)

    val argMax = adjustScoresPerPixel(extractedResults, numLabels, outputSize)

    val labelSet = mutableSetOf<String>()
    // Filter by the label set when base class changed
    for (i in 0..<classesOfInterest.size()) {
      labelSet.add(classesOfInterest.getString(i))
    }

    val res = Arguments.createMap()

    for (label in 0..<numLabels) {
      if (labelSet.contains(deeplabv3_resnet50_labels[label])) {
        res.putArray(
          deeplabv3_resnet50_labels[label],
          ArrayUtils.createReadableArrayFromFloatArray(extractedResults[label]),
        )
      }
    }

    res.putArray(
      "ARGMAX",
      ArrayUtils.createReadableArrayFromIntArray(argMax),
    )

    return res
  }

  override fun runModel(input: Triple<Mat, ReadableArray, Boolean>): WritableMap {
    val modelInput = preprocess(input.first)
    val modelOutput = forward(modelInput)
    return postprocess(modelOutput, input.second, input.third)
  }
}
