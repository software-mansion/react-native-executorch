#pragma once
#include <sstream>
#include <vector>

namespace rnexecutorch {

enum class LOG_LEVEL { Info, Error, Debug };

// const char* instead of const std::string& as va_start doesn't take references
void log(LOG_LEVEL logLevel, const char *fmt, ...);
template <typename T> void log(LOG_LEVEL logLevel, const std::vector<T> &vec) {
  std::ostringstream oss;
  oss << "Vector: [";
  std::copy(vec.begin(), vec.end(), std::ostream_iterator<T>(oss, ", "));
  std::string str = oss.str();
  str = str.substr(0, str.length() - 2); // Remove the last comma and space
  str += "]";
  log(logLevel, "%s", str.c_str());
}

} // namespace rnexecutorch
