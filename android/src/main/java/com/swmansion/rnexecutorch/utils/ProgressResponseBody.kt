package com.swmansion.rnexecutorch.utils

import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.*
import java.io.IOException

class ProgressResponseBody(
  private val responseBody: ResponseBody,
  private val progressListener: ProgressListener
) : ResponseBody() {

  interface ProgressListener {
    fun onProgress(bytesRead: Long, contentLength: Long, done: Boolean)
  }

  private var bufferedSource: BufferedSource? = null

  override fun contentType(): MediaType? = responseBody.contentType()

  override fun contentLength(): Long = responseBody.contentLength()

  override fun source(): BufferedSource {
    if (bufferedSource == null) {
      bufferedSource = source(responseBody.source()).buffer()
    }
    return bufferedSource!!
  }

  private fun source(source: Source): Source = object : ForwardingSource(source) {
    var totalBytesRead = 0L

    @Throws(IOException::class)
    override fun read(sink: Buffer, byteCount: Long): Long {
      val bytesRead = super.read(sink, byteCount)
      totalBytesRead += if (bytesRead != -1L) bytesRead else 0
      progressListener.onProgress(totalBytesRead, responseBody.contentLength(), bytesRead == -1L)
      return bytesRead
    }
  }
}
