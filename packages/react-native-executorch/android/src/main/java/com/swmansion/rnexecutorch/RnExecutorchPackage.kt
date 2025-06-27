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
    if (name == SpeechToText.NAME) {
      SpeechToText(reactContext)
    } else if (name == OCR.NAME) {
      OCR(reactContext)
    } else if (name == VerticalOCR.NAME) {
      VerticalOCR(reactContext)
    } else if (name == ETInstaller.NAME) {
      ETInstaller(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[SpeechToText.NAME] =
        ReactModuleInfo(
          SpeechToText.NAME,
          SpeechToText.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true, // hasConstants
          false, // isCxxModule
          true,
        )

      moduleInfos[OCR.NAME] =
        ReactModuleInfo(
          OCR.NAME,
          OCR.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true, // hasConstants
          false, // isCxxModule
          true,
        )

      moduleInfos[VerticalOCR.NAME] =
        ReactModuleInfo(
          VerticalOCR.NAME,
          VerticalOCR.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true, // hasConstants
          false, // isCxxModule
          true,
        )

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
