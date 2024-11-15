package com.swmansion.rnexecutorch

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager


class RnExecutorchPackage : TurboReactPackage() {
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf()
  }

   override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
     if (name == RnExecutorchModule.NAME) {
       RnExecutorchModule(reactContext)
     } else {
       null
     }

   override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
     mapOf(
       RnExecutorchModule.NAME to ReactModuleInfo(
         RnExecutorchModule.NAME,
         RnExecutorchModule.NAME,
         false, // canOverrideExistingModule
         false, // needsEagerInit
         false, // isCxxModule
         true // isTurboModule
       )
     )
   }
}