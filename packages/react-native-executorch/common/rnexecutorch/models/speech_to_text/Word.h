#pragma once

#include <string>

class Word {
public:
  Word(std::string content, float start, float end) noexcept
      : content(std::move(content)), start(start), end(end) {}

  std::string content;
  float start;
  float end;
};
