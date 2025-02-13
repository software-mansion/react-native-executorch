package com.swmansion.rnexecutorch.models.ocr.utils

import org.opencv.core.Scalar

class Constants {
  companion object {
    const val RECOGNIZER_RATIO = 1.6
    const val MODEL_HEIGHT = 64
    const val LARGE_MODEL_WIDTH = 512
    const val MEDIUM_MODEL_WIDTH = 256
    const val SMALL_MODEL_WIDTH = 128
    const val LOW_CONFIDENCE_THRESHOLD = 0.3
    const val ADJUST_CONTRAST = 0.2
    const val TEXT_THRESHOLD = 0.4
    const val LINK_THRESHOLD = 0.4
    const val LOW_TEXT_THRESHOLD = 0.7
    const val CENTER_THRESHOLD = 0.5
    const val DISTANCE_THRESHOLD = 2.0
    const val HEIGHT_THRESHOLD = 2.0
    const val MIN_SIDE_THRESHOLD = 15
    const val MAX_SIDE_THRESHOLD = 30
    const val MAX_WIDTH = (LARGE_MODEL_WIDTH + (LARGE_MODEL_WIDTH * 0.15)).toInt()
    const val MIN_SIZE = 20
    val MEAN = Scalar(0.485, 0.456, 0.406)
    val VARIANCE = Scalar(0.229, 0.224, 0.225)
  }
}
