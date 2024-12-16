package com.swmansion.rnexecutorch.models.objectdetection

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.Bbox
import com.swmansion.rnexecutorch.utils.CocoLabel
import com.swmansion.rnexecutorch.utils.Detection
import com.swmansion.rnexecutorch.utils.nms
import org.pytorch.executorch.EValue

const val detectionScoreThreshold = .7f
const val iouThreshold = .55f

class SSDLiteLargeModel(reactApplicationContext: ReactApplicationContext) : BaseModel<Mat, Array<Detection>>(reactApplicationContext) {
  private var heightRatio: Float = 1.0f
  private var widthRatio: Float = 1.0f

  private fun getModelImageSize(): Size {
    val inputShape = module.getInputShape(0)
    val width = inputShape[inputShape.lastIndex]
    val height = inputShape[inputShape.lastIndex - 1]

    return Size(height.toDouble(), width.toDouble())
  }

  override fun preprocess(input: Mat): EValue {
    this.widthRatio = (input.size().width / getModelImageSize().width).toFloat()
    this.heightRatio = (input.size().height / getModelImageSize().height).toFloat()
    Imgproc.resize(input, input, getModelImageSize())
    return ImageProcessor.matToEValue(input, module.getInputShape(0))
  }

  override fun runModel(input: Mat): Array<Detection> {
    val modelInput = preprocess(input)
    val modelOutput = forward(modelInput)
    return postprocess(modelOutput)
  }

  override fun postprocess(output: Array<EValue>): Array<Detection> {
    val scoresTensor = output[1].toTensor()
    val numel = scoresTensor.numel()
    val bboxes = output[0].toTensor().dataAsFloatArray
    val scores = scoresTensor.dataAsFloatArray
    val labels = output[2].toTensor().dataAsFloatArray

    val detections: MutableList<Detection> = mutableListOf();
    for (idx in 0 until numel.toInt()) {
      val score = scores[idx]
      if (score < detectionScoreThreshold) {
        continue
      }
      val bbox = Bbox(
        bboxes[idx * 4 + 0] * this.widthRatio,
        bboxes[idx * 4 + 1] * this.heightRatio,
        bboxes[idx * 4 + 2] * this.widthRatio,
        bboxes[idx * 4 + 3] * this.heightRatio
      )
      val label = labels[idx]
      detections.add(
        Detection(bbox, score, CocoLabel.fromId(label.toInt())!!)
      )
    }

    val detectionsPostNms = nms(detections, iouThreshold);
    return detectionsPostNms.toTypedArray()
  }
}
