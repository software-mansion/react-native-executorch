package com.swmansion.rnexecutorch.models

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import org.pytorch.executorch.Tensor


class StyleTransferModel(reactApplicationContext: ReactApplicationContext) : BaseModel<Mat, Mat>(reactApplicationContext) {
  private lateinit var originalSize: Size

  private fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  override fun preprocess(input: Mat): Mat {
    originalSize = input.size()
    Imgproc.resize(input, input, getModelImageSize())
    return input
  }

  override fun postprocess(input: Tensor): Mat {
    val modelShape = getModelImageSize()
    val result = ImageProcessor.EValueToMat(input.dataAsFloatArray, modelShape.width.toInt(), modelShape.height.toInt())
    Imgproc.resize(result, result, originalSize)
    return result
  }

  override fun runModel(input: Mat): Mat {
      val inputTensor = ImageProcessor.matToEValue(preprocess(input), module.getInputShape(0))
      val outputTensor = forward(inputTensor)
      return postprocess(outputTensor[0].toTensor())
  }
}
