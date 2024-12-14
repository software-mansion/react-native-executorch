package com.swmansion.rnexecutorch.models.objectdetection

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import org.pytorch.executorch.Tensor
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.Bbox
import com.swmansion.rnexecutorch.utils.CocoLabel
import com.swmansion.rnexecutorch.utils.Detection
import org.pytorch.executorch.EValue


class SSDLiteLargeModel(reactApplicationContext: ReactApplicationContext) : BaseModel<Mat, Array<Detection>>(reactApplicationContext) {

  private fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  override fun preprocess(input: Mat): Mat {
    Imgproc.resize(input, input, getModelImageSize())
    return input
  }

  fun postprocessFromEValue(eValues: Array<EValue>) : Array<Detection> {
    val scoresTensor = eValues[1].toTensor()
    val numel = scoresTensor.numel() // bboxes is 4 * numel, labels is the same length
    val bboxes = eValues[0].toTensor().dataAsFloatArray
    val scores = scoresTensor.dataAsFloatArray
    val labels = eValues[2].toTensor().dataAsFloatArray

    val detections: MutableList<Detection> = mutableListOf();
    for (idx in 0..numel.toInt()) {
      val bbox = Bbox(bboxes[idx], bboxes[idx + 1], bboxes[idx + 1], bboxes[idx + 1])
      val score = scores[idx]
      val label = labels[idx]
      detections.plus(
        Detection(bbox, score, CocoLabel.fromId(label.toInt())!!)
      )
    }
    return detections.toTypedArray()
  }

  override fun postprocess(input: Tensor) {
  }

  override fun runModel(input: Mat): Array<Detection> {
    val inputTensor = ImageProcessor.matToEValue(preprocess(input), module.getInputShape(0))
    val modelOutput = forward(inputTensor)
    return postprocessFromEValue(modelOutput)
  }
}
