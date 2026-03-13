package com.barern

import android.app.Application
import com.barern.BuildConfig
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.hermes.HermesInstance

class MainApplication :
  Application(),
  ReactApplication {
  @Suppress("DEPRECATION")
  override val reactNativeHost: ReactNativeHost by lazy {
    object : DefaultReactNativeHost(this) {
      override fun getPackages() =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here
        }

      override fun getJSMainModuleName() = "index"

      override fun getUseDeveloperSupport() = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = true
    }
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here
        },
      jsMainModulePath = "index",
      jsRuntimeFactory = HermesInstance(),
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
