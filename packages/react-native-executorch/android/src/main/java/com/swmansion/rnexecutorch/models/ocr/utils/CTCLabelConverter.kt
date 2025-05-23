package com.swmansion.rnexecutorch.models.ocr.utils

class CTCLabelConverter(
  characters: String,
) {
  private val dict = mutableMapOf<String, Int>()
  private val character: List<String>
  private val ignoreIdx: List<Int>

  init {
    val mutableCharacters = mutableListOf("[blank]")
    characters.forEachIndexed { index, char ->
      mutableCharacters.add(char.toString())
      dict[char.toString()] = index + 1
    }
    character = mutableCharacters.toList()

    val ignoreIndexes = mutableListOf(0)

    ignoreIdx = ignoreIndexes.toList()
  }

  fun decodeGreedy(
    textIndex: List<Int>,
    length: Int,
  ): List<String> {
    val texts = mutableListOf<String>()
    var index = 0
    while (index < textIndex.size) {
      val segmentLength = minOf(length, textIndex.size - index)
      val subArray = textIndex.subList(index, index + segmentLength)

      val text = StringBuilder()
      var lastChar: Int? = null
      val isNotRepeated = mutableListOf(true)
      val isNotIgnored = mutableListOf<Boolean>()

      subArray.forEachIndexed { i, currentChar ->
        if (i > 0) {
          isNotRepeated.add(lastChar != currentChar)
        }
        isNotIgnored.add(!ignoreIdx.contains(currentChar))
        lastChar = currentChar
      }

      subArray.forEachIndexed { j, charIndex ->
        if (isNotRepeated[j] && isNotIgnored[j]) {
          text.append(character[charIndex])
        }
      }

      texts.add(text.toString())
      index += segmentLength
      if (segmentLength < length) break
    }
    return texts.toList()
  }
}
