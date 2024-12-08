package com.swmansion.rnexecutorch.utils

import okhttp3.OkHttpClient

object OkHttpClientSingleton {
  val instance = OkHttpClient()
}