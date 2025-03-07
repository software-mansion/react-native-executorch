package com.swmansion.rnexecutorch.models.imagesegmentation

import com.facebook.react.bridge.ReadableArray
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

class ImageSegmentationModel(reactApplicationContext: ReactApplicationContext)
    : BaseModel <Pair<Mat, ReadableArray>, Map<String, List<Any>>>(reactApplicationContext) {
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
    for (pixel in 0..<numOriginalPixels) {
      val row = pixel / originalSize.width.toInt()
      val col = pixel % originalSize.height.toInt()
      val scores = mutableListOf<Float>()
      for (mat in labelScores) {
        val v = FloatArray(1)
        mat.get(row, col, v)
        scores.add(v[0])
      }

      val adjustedScores = softmax(scores.toTypedArray())

      for (label in 0..<numLabels) {
        labelScores[label].put(row, col, FloatArray(1){adjustedScores[label]})
      }

      val maxIndex = scores.withIndex().maxBy{it.value}.index
      argMax.put(row, col, IntArray(1){maxIndex})
    }

    return argMax
  }

  override fun postprocess(output: Array<EValue>): Map<String, List<Any>> {
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

    val res = mutableMapOf<String, List<Any>>()
    
    for (label in 0..<numLabels) {
      val buffer = FloatArray(numOriginalPixels)
      rescaledResults[label].get(0, 0, buffer)
      res[deeplabv3_resnet50_labels[label]] = buffer.toList()
    }

    val argMaxBuffer = IntArray(numOriginalPixels)
    argMax.get(0, 0, argMaxBuffer)
    res["argmax"] = argMaxBuffer.toList()

    return res
  }

  override fun runModel(input: Pair<Mat, ReadableArray>): Map<String, List<Any>> {
    val modelInput = preprocess(input)
    val modelOutput = forward(modelInput)
    return postprocess(modelOutput)
  }
}
