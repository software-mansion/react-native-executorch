package com.swmansion.rnexecutorch

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import java.io.InputStream
import java.net.URL

@OptIn(FrameworkAPI::class)
@ReactModule(name = ETInstaller.NAME)
class ETInstaller(
  reactContext: ReactApplicationContext,
) : NativeETInstallerSpec(reactContext) {
  companion object {
    const val NAME = NativeETInstallerSpec.NAME

    @JvmStatic
    @DoNotStrip
    @Throws(Exception::class)
    fun fetchByteDataFromUrl(source: String): ByteArray? {
      try {
        val url = URL(source)
        val connection = url.openConnection()
        connection.connect()

        val inputStream: InputStream = connection.getInputStream()
        val data = inputStream.readBytes()
        inputStream.close()

        return data
      } catch (exception: Throwable) {
        return null
      }
    }
  }

  private val mHybridData: HybridData

  external fun initHybrid(
    jsContext: Long,
    callInvoker: CallInvokerHolderImpl,
  ): HybridData

  private external fun injectJSIBindings()

  init {
    try {
      // Each backend (XNNPACK, Vulkan) ships as its own .so. When an extra is
      // enabled, libreact-native-executorch.so links against the matching .so,
      // so the dynamic linker loads it automatically here and its load-time
      // constructor registers the backend with libexecutorch.so's registry.
      System.loadLibrary("executorch")
      System.loadLibrary("react-native-executorch")
      val jsCallInvokerHolder = reactContext.jsCallInvokerHolder as CallInvokerHolderImpl
      mHybridData = initHybrid(reactContext.javaScriptContextHolder!!.get(), jsCallInvokerHolder)
    } catch (exception: UnsatisfiedLinkError) {
      throw RuntimeException("Could not load native module ETInstaller", exception)
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  override fun install(): Boolean {
    injectJSIBindings()
    return true
  }
}
