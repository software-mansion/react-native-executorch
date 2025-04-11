package com.swmansion.rnexecutorch

import com.facebook.jni.HybridData
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl

@OptIn(FrameworkAPI::class)
@ReactModule(name = ETInstaller.NAME)
class ETInstaller(
  reactContext: ReactApplicationContext,
) : NativeETInstallerSpec(reactContext) {
  companion object {
    const val NAME = NativeETInstallerSpec.NAME
  }

  private val mHybridData: HybridData

  external fun initHybrid(
    jsContext: Long,
    callInvoker: CallInvokerHolderImpl,
  ): HybridData

  private external fun injectJSIBindings()

  init {
    try {
      System.loadLibrary("executorch")
      System.loadLibrary("react-native-executorch")
      val jsCallInvokerHolder = reactContext.jsCallInvokerHolder as CallInvokerHolderImpl
      mHybridData = initHybrid(reactContext.javaScriptContextHolder!!.get(), jsCallInvokerHolder)
    } catch (exception: UnsatisfiedLinkError) {
      throw RuntimeException("Could not load native module Install", exception)
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  override fun install(): Boolean {
    injectJSIBindings()
    return true
  }
}
