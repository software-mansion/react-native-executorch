package com.swmansion.rnexecutorch

import android.content.Context
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException
import java.io.File
import java.io.FileOutputStream
import java.net.URL

enum class ResourceType {
    TOKENIZER,
    MODEL
}

class Fetcher {
    companion object {
        private fun saveResponseToFile(
            response: Response,
            directory: File,
            fileName: String
        ): File {
            val file = File(directory.path, fileName)
            file.outputStream().use { outputStream ->
                response.body?.byteStream()?.copyTo(outputStream)
            }
            return file
        }

        private fun hasValidExtension(fileName: String, resourceType: ResourceType): Boolean {
            return when (resourceType) {
                ResourceType.TOKENIZER -> {
                    fileName.endsWith(".bin")
                }

                ResourceType.MODEL -> {
                    fileName.endsWith(".pte")
                }
            }
        }

        private fun extractFileName(url: URL): String {
            if (url.path == "/assets/") {
                val pathSegments = url.toString().split('/')
                return pathSegments[pathSegments.size - 1].split("?")[0]
            } else if (url.protocol == "file") {
                val localPath = url.toString().split("://")[1]
                val file = File(localPath)
                if (file.exists()) {
                    return localPath
                }

                throw Exception("file_not_found")
            } else {
                return url.path.substringAfterLast('/')
            }
        }

        private fun fetchModel(file: File, validFile: File, client: OkHttpClient, url: URL, onComplete: (String?, Exception?) -> Unit,
                               listener: ProgressResponseBody.ProgressListener? = null){
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

        fun downloadResource(
            context: Context,
            client: OkHttpClient,
            url: URL,
            resourceType: ResourceType,
            onComplete: (String?, Exception?) -> Unit,
            listener: ProgressResponseBody.ProgressListener? = null
        ) {
            /*
            Fetching model and tokenizer file
            1. Extract file name from provided URL
            2. If file name contains / it means that the file is local and we should return the path
            3. Check if the file has a valid extension
                a. For tokenizer, the extension should be .bin
                b. For model, the extension should be .pte
            4. Check if models directory exists, if not create it
            5. Check if the file already exists in the models directory, if yes return the path
            6. If the file does not exist, and is a tokenizer, fetch the file
            7. If the file is a model, fetch the file with ProgressResponseBody
             */
            val fileName: String

            try {
                fileName = extractFileName(url)
            } catch (e: Exception) {
                onComplete(null, e)
                return
            }

            if(fileName.contains("/")){
                onComplete(fileName, null)
                return
            }

            if (!hasValidExtension(fileName, resourceType)) {
                onComplete(null, Exception("invalid_resource_extension"))
                return
            }

            var tempFile = File(context.filesDir, fileName)
            if(tempFile.exists()){
                tempFile.delete()
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

            if (resourceType == ResourceType.TOKENIZER) {
                val request = Request.Builder().url(url).build()
                val response = client.newCall(request).execute()

                if (!response.isSuccessful) {
                    onComplete(null, Exception("download_error"))
                    return
                }

                validFile = saveResponseToFile(response, modelsDirectory, fileName)
                onComplete(validFile.absolutePath, null)
                return
            }

            fetchModel(tempFile, validFile, client, url, onComplete, listener)
        }
    }
}