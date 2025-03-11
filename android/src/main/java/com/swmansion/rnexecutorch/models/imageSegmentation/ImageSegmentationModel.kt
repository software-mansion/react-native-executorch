package com.swmansion.rnexecutorch.models.imagesegmentation

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ImageProcessor
import com.swmansion.rnexecutorch.utils.softmax
import org.opencv.core.Mat
import org.opencv.core.CvType
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import org.pytorch.executorch.Tensor
import org.pytorch.executorch.EValue
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils

class ImageSegmentationModel(reactApplicationContext: ReactApplicationContext)
    : BaseModel <Pair<Mat, ReadableArray>, WritableMap>(reactApplicationContext) {
  private lateinit var originalSize: Size

  private fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  override fun preprocess(input: Pair<Mat, ReadableArray>): EValue {
    originalSize = input.first.size()
    Imgproc.resize(input.first, input.first, getModelImageSize())
    return ImageProcessor.matToEValue(input.first, module.getInputShape(0))
  }

  private fun rescaleResults(result: Array<Float>, numLabels: Int)
        : List<Mat> {
    val modelShape = getModelImageSize()
    val numModelPixels = (modelShape.height * modelShape.width).toInt()

    val resizedLabelScores = mutableListOf<Mat>()

    for (label in 0..<numLabels) {
      val mat = Mat(modelShape, CvType.CV_32F)

      for (pixel in 0..<numModelPixels) {
        val row = pixel / modelShape.width.toInt()
        val col = pixel % modelShape.width.toInt()
        val v = floatArrayOf(result[label * numModelPixels + pixel])
        mat.put(row, col, v)
      }

      val resizedMat = Mat()
      Imgproc.resize(mat, resizedMat, originalSize)
      resizedLabelScores.add(resizedMat)
    }
    return resizedLabelScores;
  }

  private fun adjustScoresPerPixel(labelScores: List<Mat>, numLabels: Int)
        : Mat {
    val argMax = Mat(originalSize, CvType.CV_32S)
    val numOriginalPixels = (originalSize.height * originalSize.width).toInt()
    android.util.Log.d("ETTT", "adjustScoresPerPixel: start")
    for (pixel in 0..<numOriginalPixels) {
      val row = pixel / originalSize.width.toInt()
      val col = pixel % originalSize.width.toInt()
      val scores = mutableListOf<Float>()
      for (mat in labelScores) {
        scores.add(mat.get(row, col)[0].toFloat())
      }
      val adjustedScores = softmax(scores.toTypedArray())
      for (label in 0..<numLabels) {
        labelScores[label].put(row, col, floatArrayOf(adjustedScores[label]))
      }

      val maxIndex = scores.withIndex().maxBy{it.value}.index
      argMax.put(row, col, intArrayOf(maxIndex))
    }

    return argMax
  }

  override fun postprocess(output: Array<EValue>)
    : WritableMap {
    val output = output[0].toTensor().dataAsFloatArray.toTypedArray()
    val modelShape = getModelImageSize()
    val numLabels = deeplabv3_resnet50_labels.size;
    val numOriginalPixels = (originalSize.height * originalSize.width).toInt()

    require(output.count() == (numLabels * modelShape.height * modelShape.width).toInt())
      {"Model generated unexpected output size."}

    val rescaledResults = rescaleResults(output, numLabels)

    val argMax = adjustScoresPerPixel(rescaledResults, numLabels)

    // val labelSet = mutableSetOf<String>()
    // Filter by the label set when base class changed

    val res = Arguments.createMap()

    for (label in 0..<numLabels) {
      val buffer = FloatArray(numOriginalPixels)
      for (pixel in 0..<numOriginalPixels) {
        val row = pixel / originalSize.width.toInt()
        val col = pixel % originalSize.width.toInt()
        buffer[pixel] = rescaledResults[label].get(row, col)[0].toFloat()
      }
      res.putArray(deeplabv3_resnet50_labels[label], 
                   ArrayUtils.createReadableArrayFromFloatArray(buffer))
    }

    val argMaxBuffer = IntArray(numOriginalPixels)
    for (pixel in 0..<numOriginalPixels) {
      val row = pixel / originalSize.width.toInt()
      val col = pixel % originalSize.width.toInt()
      argMaxBuffer[pixel] = argMax.get(row, col)[0].toInt()
    }
    res.putArray("argmax", 
                 ArrayUtils.createReadableArrayFromIntArray(argMaxBuffer))

    return res
  }

  override fun runModel(input: Pair<Mat, ReadableArray>)
    : WritableMap {
    val modelInput = preprocess(input)
    val modelOutput = forward(modelInput)
    return postprocess(modelOutput)
  }
}
