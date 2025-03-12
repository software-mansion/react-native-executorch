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
    if (name == LLM.NAME) {
      LLM(reactContext)
    } else if (name == ETModule.NAME) {
      ETModule(reactContext)
    } else if (name == StyleTransfer.NAME) {
      StyleTransfer(reactContext)
    } else if (name == Classification.NAME) {
      Classification(reactContext)
    } else if (name == ObjectDetection.NAME) {
      ObjectDetection(reactContext)
    } else if (name == SpeechToText.NAME) {
      SpeechToText(reactContext)
    } else if (name == OCR.NAME) {
      OCR(reactContext)
    } else if (name == VerticalOCR.NAME) {
      VerticalOCR(reactContext)
    } else if (name == ImageSegmentation.NAME) {
      ImageSegmentation(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[LLM.NAME] =
        ReactModuleInfo(
          LLM.NAME,
          LLM.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )
      moduleInfos[ETModule.NAME] =
        ReactModuleInfo(
          ETModule.NAME,
          ETModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[StyleTransfer.NAME] =
        ReactModuleInfo(
          StyleTransfer.NAME,
          StyleTransfer.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[Classification.NAME] =
        ReactModuleInfo(
          Classification.NAME,
          Classification.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[ObjectDetection.NAME] =
        ReactModuleInfo(
          ObjectDetection.NAME,
          ObjectDetection.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[SpeechToText.NAME] =
        ReactModuleInfo(
          SpeechToText.NAME,
          SpeechToText.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[OCR.NAME] =
        ReactModuleInfo(
          OCR.NAME,
          OCR.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[VerticalOCR.NAME] =
        ReactModuleInfo(
          VerticalOCR.NAME,
          VerticalOCR.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,
        )

      moduleInfos[ImageSegmentation.NAME] = ReactModuleInfo(
        ImageSegmentation.NAME, ImageSegmentation.NAME, false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true
      )
      moduleInfos
    }
}
