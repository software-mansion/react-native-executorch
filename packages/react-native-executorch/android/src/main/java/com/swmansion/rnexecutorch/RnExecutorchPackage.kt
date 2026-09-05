package com.swmansion.rnexecutorch

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RnExecutorchPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      RnExecutorchModule.NAME -> RnExecutorchModule(reactContext)
      // ==============================================================================
      // LEGACY SUPPORT: ETInstaller (Remove when react-native-executorch/legacy is dropped)
      // ==============================================================================
      ETInstaller.NAME -> {
        try {
          ETInstaller(reactContext)
        } catch (e: RuntimeException) {
          if (e.cause is UnsatisfiedLinkError) {
            ETInstallerUnavailable(reactContext)
          } else {
            throw e
          }
        }
      }
      // ==============================================================================
      else -> null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        RnExecutorchModule.NAME to ReactModuleInfo(
          RnExecutorchModule.NAME,
          RnExecutorchModule.NAME,
          false,
          false,
          true,
          false,
          true
        ),
        // ==============================================================================
        // LEGACY SUPPORT: ETInstaller (Remove when react-native-executorch/legacy is dropped)
        // ==============================================================================
        ETInstaller.NAME to ReactModuleInfo(
          ETInstaller.NAME,
          ETInstaller.NAME,
          false,
          false,
          true,
          false,
          true
        )
        // ==============================================================================
      )
    }
}
