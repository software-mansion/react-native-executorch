package com.swmansion.rnexecutorch

enum class ChatRole {
  SYSTEM,
  USER,
  ASSISTANT
}

const val BEGIN_OF_TEXT_TOKEN = "<|begin_of_text|>"
const val END_OF_TEXT_TOKEN = "<|eot_id|>"
const val START_HEADER_ID_TOKEN = "<|start_header_id|>"
const val END_HEADER_ID_TOKEN = "<|end_header_id|>"

class ConversationManager(val numMessagesContextWindow: Int, systemPrompt: String) {
  private val basePrompt: String;
  private val messages = ArrayDeque<String>();

  init {
    this.basePrompt =
        BEGIN_OF_TEXT_TOKEN + 
        getHeaderTokenFromRole(ChatRole.SYSTEM) +
        systemPrompt +
        END_OF_TEXT_TOKEN +
        getHeaderTokenFromRole(ChatRole.USER)
  }

  fun addResponse(text: String, senderRole: ChatRole) {
    if (this.messages.size >= this.numMessagesContextWindow) {
      this.messages.removeFirst()
    }
    var formattedMessage = "";
    if (senderRole == ChatRole.ASSISTANT) {
      formattedMessage = text + getHeaderTokenFromRole(ChatRole.USER)
    } else {
      formattedMessage = 
        text +
        END_OF_TEXT_TOKEN +
        getHeaderTokenFromRole(ChatRole.ASSISTANT)
    }
    this.messages.add(formattedMessage)
  }

  fun getConversation(): String {
    val prompt = StringBuilder(this.basePrompt)
    for (elem in this.messages) {
      prompt.append(elem)
    }
    return prompt.toString()
  }

  private fun getHeaderTokenFromRole(role: ChatRole): String {
    return when (role) {
      ChatRole.SYSTEM -> START_HEADER_ID_TOKEN + "system" + END_HEADER_ID_TOKEN
      ChatRole.USER -> START_HEADER_ID_TOKEN + "user" + END_HEADER_ID_TOKEN
      ChatRole.ASSISTANT -> START_HEADER_ID_TOKEN + "assistant" + END_HEADER_ID_TOKEN
    }
  }
}
