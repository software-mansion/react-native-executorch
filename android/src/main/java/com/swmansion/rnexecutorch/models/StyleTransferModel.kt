package com.swmansion.rnexecutorch.models

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import org.pytorch.executorch.EValue

class StyleTransferModel(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<Mat, Mat>(reactApplicationContext) {
  private lateinit var originalSize: Size

  private fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  override fun preprocess(input: Mat): EValue {
    originalSize = input.size()
    Imgproc.resize(input, input, getModelImageSize())
    return ImageProcessor.matToEValue(input, module.getInputShape(0))
  }

  override fun postprocess(output: Array<EValue>): Mat {
    val tensor = output[0].toTensor()
    val modelShape = getModelImageSize()
    val result = ImageProcessor.EValueToMat(tensor.dataAsFloatArray, modelShape.width.toInt(), modelShape.height.toInt())
    Imgproc.resize(result, result, originalSize)
    return result
  }

  override fun runModel(input: Mat): Mat {
    val modelInput = preprocess(input)
    val modelOutput = forward(modelInput)
    return postprocess(modelOutput)
  }
}
