package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise

class RnExecutorchImpl {
    fun multiply(a: Double, b: Double, promise: Promise) {
        promise.resolve(a + b)
    }

    companion object {
        const val NAME = "RnExecutorch"
    }
}