package com.swmansion.rnexecutorch

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.module.annotations.ReactModule

/**
 * Fallback TurboModule returned when native ExecuTorch libraries cannot be
 * loaded (e.g. 32-bit Android devices where only arm64-v8a binaries are
 * shipped). Extends the same spec as ETInstaller so JS sees a real linked
 * module, but install() returns false to signal unavailability.
 */
@OptIn(FrameworkAPI::class)
@ReactModule(name = ETInstallerUnavailable.NAME)
class ETInstallerUnavailable(
  reactContext: ReactApplicationContext,
) : NativeETInstallerSpec(reactContext) {
  companion object {
    const val NAME = NativeETInstallerSpec.NAME
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  override fun install(): Boolean {
    return false
  }
}
