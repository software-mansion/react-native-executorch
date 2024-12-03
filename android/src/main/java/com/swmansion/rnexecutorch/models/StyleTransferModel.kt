package com.swmansion.rnexecutorch.models

import android.graphics.Bitmap
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.TensorUtils
import org.pytorch.executorch.EValue

class StyleTransferModel(reactApplicationContext: ReactApplicationContext) : Model<Bitmap, Bitmap>(reactApplicationContext) {
  override fun runModel(input: Bitmap): Bitmap {
      val processedData = preprocess(input)
      val inputTensor = TensorUtils.bitmapToFloat32Tensor(processedData)

      val outputTensor = forward(EValue.from(inputTensor))
      val outputData = postprocess(TensorUtils.float32TensorToBitmap(outputTensor))

      return outputData
  }

  override fun preprocess(input: Bitmap): Bitmap {
    val inputBitmap = Bitmap.createScaledBitmap(
      input,
      640, 640, true
    )
    return inputBitmap
  }

  override fun postprocess(input: Bitmap): Bitmap {
    val scaledUpBitmap = Bitmap.createScaledBitmap(
      input,
      1280, 1280, true
    )
    return scaledUpBitmap
  }
}
