package com.swmansion.rnexecutorch

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class RnExecutorchPackage : TurboReactPackage() {
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf()

  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? =
    if (name == ETInstaller.NAME) {
      try {
        ETInstaller(reactContext)
      } catch (e: RuntimeException) {
        if (e.cause is UnsatisfiedLinkError) {
          // Native library not available (e.g. 32-bit device without arm64-v8a .so).
          // Return a fallback module whose install() returns false so JS can
          // distinguish "unsupported ABI" from "package not linked."
          ETInstallerUnavailable(reactContext)
        } else {
          throw e
        }
      }
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[ETInstaller.NAME] =
        ReactModuleInfo(
          ETInstaller.NAME,
          ETInstaller.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true, // hasConstants
          false, // isCxxModule
          true,
        )

      moduleInfos
    }
}
