package com.swmansion.rnexecutorch.models.classification

fun softmax(x: Array<Float>): Array<Float> {
    val max = x.maxOrNull()!!
    val exps = x.map { kotlin.math.exp(it - max) }
    val sum = exps.sum()
    return exps.map { it / sum }.toTypedArray()
}