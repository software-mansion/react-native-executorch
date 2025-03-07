package com.swmansion.rnexecutorch.models.ocr

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.models.ocr.utils.Constants
import com.swmansion.rnexecutorch.models.ocr.utils.DetectorUtils
import com.swmansion.rnexecutorch.models.ocr.utils.OCRbBox
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Size
import org.pytorch.executorch.EValue

class Detector(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<Mat, List<OCRbBox>>(reactApplicationContext) {
  private lateinit var originalSize: Size

  fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex - 1]
    val height = inputShape[inputShape.lastIndex]

    val modelImageSize = Size(height.toDouble(), width.toDouble())

    return modelImageSize
  }

  override fun preprocess(input: Mat): EValue {
    originalSize = Size(input.cols().toDouble(), input.rows().toDouble())
    val resizedImage =
      ImageProcessor.resizeWithPadding(
        input,
        getModelImageSize().width.toInt(),
        getModelImageSize().height.toInt(),
      )

    return ImageProcessor.matToEValue(
      resizedImage,
      module.getInputShape(0),
      Constants.MEAN,
      Constants.VARIANCE,
    )
  }

  override fun postprocess(output: Array<EValue>): List<OCRbBox> {
    val outputTensor = output[0].toTensor()
    val outputArray = outputTensor.dataAsFloatArray
    val modelImageSize = getModelImageSize()

    val (scoreText, scoreLink) =
      DetectorUtils.interleavedArrayToMats(
        outputArray,
        Size(modelImageSize.width / 2, modelImageSize.height / 2),
      )
    var bBoxesList =
      DetectorUtils.getDetBoxesFromTextMap(
        scoreText,
        scoreLink,
        Constants.TEXT_THRESHOLD,
        Constants.LINK_THRESHOLD,
        Constants.LOW_TEXT_THRESHOLD,
      )

    bBoxesList =
      DetectorUtils.restoreBoxRatio(bBoxesList, (Constants.RECOGNIZER_RATIO * 2).toFloat())

    bBoxesList =
      DetectorUtils.groupTextBoxes(
        bBoxesList,
        Constants.CENTER_THRESHOLD,
        Constants.DISTANCE_THRESHOLD,
        Constants.HEIGHT_THRESHOLD,
        Constants.MIN_SIDE_THRESHOLD,
        Constants.MAX_SIDE_THRESHOLD,
        Constants.MAX_WIDTH,
      )

    return bBoxesList.toList()
  }

  override fun runModel(input: Mat): List<OCRbBox> = postprocess(forward(preprocess(input)))
}
