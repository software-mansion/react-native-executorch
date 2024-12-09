package com.swmansion.rnexecutorch.models

import android.graphics.Bitmap
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.TensorUtils
import org.pytorch.executorch.EValue

class StyleTransferModel(reactApplicationContext: ReactApplicationContext) : BaseModel<Bitmap, Bitmap>(reactApplicationContext) {
  override fun runModel(input: Bitmap): Bitmap {
      val processedData = preprocess(input)
      val inputTensor = TensorUtils.bitmapToFloat32Tensor(processedData)

      Log.d("RnExecutorch", module.numberOfInputs.toString())
      for (i in 0 until module.numberOfInputs) {
        Log.d("RnExecutorch", module.getInputType(i).toString())
        for(shape in module.getInputShape(i)){
          Log.d("RnExecutorch", shape.toString())
        }
      }

      Log.d("RnExecutorch", module.numberOfOutputs.toString())
      for(i in 0 until module.numberOfOutputs){
        Log.d("RnExecutorch", module.getOutputType(i).toString())
        for(shape in module.getOutputShape(i)){
          Log.d("RnExecutorch", shape.toString())
        }
      }

      val outputTensor = forward(EValue.from(inputTensor))
      val outputData = postprocess(TensorUtils.float32TensorToBitmap(outputTensor[0].toTensor()))

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
