package com.swmansion.rnexecutorch.utils

import android.content.Context
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okio.IOException
import java.io.File
import java.io.FileOutputStream
import java.net.URL

enum class ResourceType {
  TOKENIZER,
  MODEL,
}

class Fetcher {
  companion object {
    private fun saveResponseToFile(
      response: Response,
      directory: File,
      fileName: String,
    ): File {
      val file = File(directory.path, fileName)
      file.outputStream().use { outputStream ->
        response.body?.byteStream()?.copyTo(outputStream)
      }
      return file
    }

    private fun getValidExtension(resourceType: ResourceType): String {
      return when (resourceType) {
        ResourceType.TOKENIZER -> {
          "bin"
        }

        ResourceType.MODEL -> {
          "pte"
        }
      }
    }

    private fun extractFileName(url: URL): String {
      if (url.path == "/assets/") {
        val pathSegments = url.toString().split('/')
        return pathSegments[pathSegments.size - 1].split("?")[0]
      }

      return url.path.substringAfterLast('/')
    }

    private fun fetchModel(
      file: File,
      validFile: File,
      client: OkHttpClient,
      url: URL,
      onComplete: (String?, Exception?) -> Unit,
      listener: ProgressResponseBody.ProgressListener? = null,
    ) {
      val request = Request.Builder().url(url).build()
      client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          onComplete(null, e)
        }

        override fun onResponse(call: Call, response: Response) {
          if (!response.isSuccessful) {
            onComplete(null, Exception("download_error"))
          }

          response.body?.let { body ->
            val progressBody = listener?.let { ProgressResponseBody(body, it) }
            val inputStream = progressBody?.source()?.inputStream()
            inputStream?.use { input ->
              FileOutputStream(file).use { output ->
                val buffer = ByteArray(2048)
                var bytesRead: Int
                while (input.read(buffer).also { bytesRead = it } != -1) {
                  output.write(buffer, 0, bytesRead)
                }
              }
            }

            if (file.renameTo(validFile)) {
              onComplete(validFile.absolutePath, null)
            } else {
              onComplete(null, Exception("Failed to move the file to the valid location"))
            }
          }
        }
      })
    }

    private fun isUrlPointingToHfRepo(url: URL): Boolean {
      val expectedHost = "huggingface.co"
      val expectedPathPrefix = "/software-mansion/"
      if (url.host != expectedHost) {
        return false
      }
      return url.path.startsWith(expectedPathPrefix)
    }

    private fun resolveConfigUrlFromModelUrl(modelUrl: URL): URL {
      // Create a new URL using the base URL and append the desired path
      val baseUrl =
        modelUrl.protocol + "://" + modelUrl.host + modelUrl.path.substringBefore("resolve/")
      return URL(baseUrl + "resolve/main/config.json")
    }

    private fun sendRequestToUrl(
      url: URL,
      method: String,
      body: RequestBody?,
      client: OkHttpClient
    ): Response {
      val request = Request.Builder()
        .url(url)
        .method(method, body)
        .build()
      val response = client.newCall(request).execute()
      return response
    }

    private fun getIdOfResource(
      context: Context,
      resourceName: String,
      defType: String = "raw"
    ): Int {
      return context.resources.getIdentifier(resourceName, defType, context.packageName)
    }

    private fun getResourceFromAssets(
      context: Context,
      url: String,
      resourceType: ResourceType,
      onComplete: (String?, Exception?) -> Unit
    ) {
      if (!url.contains("://")) {
        //The provided file is from react-native assets folder in release mode
        val resId = getIdOfResource(context, url)
        val resName = context.resources.getResourceEntryName(resId)
        val fileExtension = getValidExtension(resourceType)
        context.resources.openRawResource(resId).use { inputStream ->
          val file = File(
            context.filesDir,
            "$resName.$fileExtension"
          )
          file.outputStream().use { outputStream ->
            inputStream.copyTo(outputStream)
          }
          onComplete(file.absolutePath, null)
          return
        }
      }
    }

    private fun getLocalFile(
      url: URL,
      resourceType: ResourceType,
      onComplete: (String?, Exception?) -> Unit
    ) {
      // The provided file is a local file, get rid of the file:// prefix and return path
      if (url.protocol == "file") {
        val localPath = url.path
        if (getValidExtension(resourceType) != localPath.takeLast(3)) {
          throw Exception("invalid_extension")
        }

        val file = File(localPath)
        if (file.exists()) {
          onComplete(localPath, null)
          return
        }

        throw Exception("file_not_found")
      }
    }

    private fun getRemoteFile(
      context: Context,
      url: URL,
      resourceType: ResourceType,
      isLargeFile: Boolean,
      onComplete: (String?, Exception?) -> Unit,
      listener: ProgressResponseBody.ProgressListener?
    ) {
      val client = OkHttpClientSingleton.instance
      val fileName = extractFileName(url)

      if (getValidExtension(resourceType) != fileName.takeLast(3)) {
        throw Exception("invalid_extension")
      }

      val modelsDirectory = File(context.filesDir, "models").apply {
        if (!exists()) {
          mkdirs()
        }
      }

      var validFile = File(modelsDirectory, fileName)
      if (validFile.exists()) {
        onComplete(validFile.absolutePath, null)
        return
      }

      // If the url is a Software Mansion HuggingFace repo, we want to send a HEAD
      // request to the config.json file, this increments HF download counter
      // https://huggingface.co/docs/hub/models-download-stats
      if (isUrlPointingToHfRepo(url)) {
        val configUrl = resolveConfigUrlFromModelUrl(url)
        sendRequestToUrl(configUrl, "HEAD", null, client)
      }

      if (!isLargeFile) {
        val request = Request.Builder().url(url).build()
        val response = client.newCall(request).execute()

        if (!response.isSuccessful) {
          throw Exception("download_error")
        }

        validFile = saveResponseToFile(response, modelsDirectory, fileName)
        onComplete(validFile.absolutePath, null)
        return
      }

      val tempFile = File(context.filesDir, fileName)
      if (tempFile.exists()) {
        tempFile.delete()
      }

      fetchModel(tempFile, validFile, client, url, onComplete, listener)
    }

    fun downloadModel(context: Context, url: String, callback: (String?, Exception?) -> Unit) {
      downloadResource(context,
        url,
        ResourceType.MODEL,
        false,
        { path, error -> callback(path, error) })
    }

    fun downloadResource(
      context: Context,
      url: String,
      resourceType: ResourceType,
      isLargeFile: Boolean,
      onComplete: (String?, Exception?) -> Unit,
      listener: ProgressResponseBody.ProgressListener? = null,
    ) {
      /*
      Fetching model and tokenizer file
      1. Check if the provided file is a bundled local file
         a. Check if it exists
         b. Check if it has valid extension
         c. Copy the file and return the path
      2. Check if the provided file is a path to a local file
         a. Check if it exists
         b. Check if it has valid extension
         c. Return the path
      3. The provided file is a remote file
          a. Check if it has valid extension
          b. Check if it's a large file
              i. Create temporary file to store it at download time
              ii. Move it to the models directory and return the path
          c. If it's not a large file download it and return the path
       */

      try {
        getResourceFromAssets(context, url, resourceType, onComplete)

        val resUrl = URL(url)
        /*
          The provided file is either a remote file or a local file
          - local file: file:///path/to/file
          - remote file: https://path/to/file || http://10.0.2.2:8080/path/to/file
        */
        getLocalFile(resUrl, resourceType, onComplete)

        /*
           The provided file is a remote file, if it's a large file
           create temporary file to store it at download time and later
           move it to the models directory
         */
        getRemoteFile(context, resUrl, resourceType, isLargeFile, onComplete, listener)
      } catch (e: Exception) {
        onComplete(null, e)
        return
      }
    }
  }
}
