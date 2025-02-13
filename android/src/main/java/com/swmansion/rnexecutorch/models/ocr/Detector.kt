package com.swmansion.rnexecutorch.models.ocr

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.models.ocr.utils.DetectorUtils
import com.swmansion.rnexecutorch.models.ocr.utils.OCRbBox
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.pytorch.executorch.EValue

val mean: Scalar = Scalar(0.485, 0.456, 0.406)
val variance: Scalar = Scalar(0.229, 0.224, 0.225)

class Detector(reactApplicationContext: ReactApplicationContext) :
  BaseModel<Mat, List<OCRbBox>>(reactApplicationContext) {
  private lateinit var originalSize: Size

  fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    val modelImageSize = Size(height.toDouble(), width.toDouble())

    return modelImageSize
  }

  override fun preprocess(input: Mat): EValue {
    originalSize = Size(input.cols().toDouble(), input.rows().toDouble())
    val resizedImage = ImageProcessor.resizeWithPadding(
      input,
      getModelImageSize().width.toInt(),
      getModelImageSize().height.toInt()
    )

    return ImageProcessor.matToEValue(resizedImage, module.getInputShape(0), mean, variance)
  }

  override fun postprocess(output: Array<EValue>): List<OCRbBox> {
    val outputTensor = output[0].toTensor()
    val outputArray = outputTensor.dataAsFloatArray
    val modelImageSize = getModelImageSize()

    val (scoreText, scoreLink) = DetectorUtils.interleavedArrayToMats(
      outputArray,
      Size(modelImageSize.width / 2, modelImageSize.height / 2)
    )
    var bBoxesList = DetectorUtils.getDetBoxesFromTextMap(scoreText, scoreLink, 0.4, 0.4, 0.7)
    bBoxesList = DetectorUtils.restoreBoxRatio(bBoxesList, 3.2f)
    bBoxesList = DetectorUtils.groupTextBoxes(bBoxesList, 0.5, 2.0, 2.0, 15, 30, 678)

    return bBoxesList.toList()
  }

  override fun runModel(input: Mat): List<OCRbBox> {
    val modelInput = preprocess(input)
    val modelOutput = forward(modelInput)
    Log.d("rn_executorch", "modelOutput: $modelOutput")
    val output = postprocess(modelOutput)
    return output
  }
}
