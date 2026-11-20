package com.swmansion.rnexecutorch

import android.system.Os
import android.util.Log
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactApplicationContext

class RnExecutorchModule(
  reactContext: ReactApplicationContext,
) : RnExecutorchSpec(reactContext) {
  override fun getName(): String = NAME

  override fun install(): Boolean {
    val contextHolder: JavaScriptContextHolder =
      reactApplicationContext.javaScriptContextHolder ?: return false
    if (!nativeLibrariesLoaded) return false
    exposeQnnSkels()
    nativeInstall(contextHolder.get())
    return true
  }

  // The Hexagon DSP loads the QNN skel libraries by path, searching
  // ADSP_LIBRARY_PATH, so it has to name the app's native library dir before
  // the first QNN model loads. The skels are only on disk when the app extracts
  // its native libs (packaging.jniLibs.useLegacyPackaging = true); without them
  // the variable stays unset and the JS side does not offer QNN variants.
  private fun exposeQnnSkels() {
    val libDir = reactApplicationContext.applicationInfo.nativeLibraryDir ?: return
    val hasSkel =
      java.io
        .File(libDir)
        .list()
        ?.any { it.startsWith("libQnnHtpV") && it.endsWith("Skel.so") } == true
    if (!hasSkel) return
    val defaults = "/vendor/dsp/cdsp;/vendor/lib/rfsa/adsp;/system/lib/rfsa/adsp;/dsp"
    Os.setenv("ADSP_LIBRARY_PATH", "$libDir;$defaults", true)
  }

  companion object {
    const val NAME = "RnExecutorch"

    // Loaded on first install() rather than in a static initializer, so a
    // device the prebuilt libraries do not cover (32-bit ABIs) gets a JS error
    // instead of a native crash when the module class is initialized.
    private val nativeLibrariesLoaded: Boolean by lazy {
      try {
        System.loadLibrary("executorch")
        System.loadLibrary("RnExecutorch")
        true
      } catch (e: UnsatisfiedLinkError) {
        Log.e(NAME, "Failed to load native libraries", e)
        false
      }
    }

    @JvmStatic
    external fun nativeInstall(jsi: Long)
  }
}
