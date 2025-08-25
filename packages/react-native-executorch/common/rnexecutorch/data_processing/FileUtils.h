#pragma once

#include <chrono>
#include <filesystem>
#include <fstream>
#include <string>

namespace rnexecutorch::file_utils {

inline std::string getTimeID() {
  return std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(
                            std::chrono::system_clock::now().time_since_epoch())
                            .count());
}

inline std::string loadBytesFromFile(const std::string &path) {
  std::ifstream fs(path, std::ios::in | std::ios::binary);
  if (fs.fail()) {
    throw std::runtime_error("Failed to open tokenizer file");
  }
  std::string data;
  fs.seekg(0, std::ios::end);
  size_t size = static_cast<size_t>(fs.tellg());
  fs.seekg(0, std::ios::beg);
  data.resize(size);
  fs.read(data.data(), size);
  return data;
};

} // namespace rnexecutorch::file_utils
