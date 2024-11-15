package com.swmansion.rnexecutorch

import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.OkHttpClient
import okhttp3.Request
import org.pytorch.executorch.LlamaModule
import org.pytorch.executorch.LlamaCallback
import java.io.File
import java.net.URL
import com.swmansion.rnexecutorch.NativeRnExecutorchSpec

class RnExecutorchModule(reactContext: ReactApplicationContext) :
  NativeRnExecutorchSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  override fun getName() = NAME

  companion object {
    const val NAME = "RnExecutorch"
  }
}
