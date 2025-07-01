#pragma once
#include "Log.h"

namespace low_level_log_implementation {

void printElement(std::ostream &os, bool value) {
  os << (value ? "true" : "false");
}

void printElement(std::ostream &os, const std::error_code &ec);

template <typename T>
  requires concepts::Streamable<T> && (!concepts::SmartPointer<T>)
void printElement(std::ostream &os, const T &value) {
  os << value;
}

template <typename T, typename U>
void printElement(std::ostream &os, const std::pair<T, U> &p) {
  os << "(";
  printElement(os, p.first);
  os << ", ";
  printElement(os, p.second);
  os << ")";
}

template <std::size_t N>
void printElement(std::ostream &os, const char (&array)[N]) {
  // Treats the input as a string up to length N, drop null termination
  if (N > 1) {
    os << std::string_view(array, N - 1);
  }
}

// A special function for C-style arrays deducing size via template
template <typename T, std::size_t N>
void printElement(std::ostream &os, T (&array)[N]) {
  os << "[";
  for (std::size_t i = 0; i < N; ++i) {
    if (i > 0)
      os << ", ";
    printElement(os, array[i]);
  }
  os << "]";
}

template <typename T>
  requires concepts::Iterable<T> && (!concepts::Streamable<T>)
void printElement(std::ostream &os, const T &container) {
  os << "[";
  auto it = std::begin(container);
  if (it != std::end(container)) {
    printElement(os, *it++);
    for (; it != std::end(container); ++it) {
      os << ", ";
      printElement(os, *it);
    }
  }
  os << "]";
}

template <typename T>
  requires concepts::Sequencable<T>
void printElement(
    std::ostream &os,
    T container) { // Pass by value to prevent modifications to the original
  os << "[";

  bool isFirst = true;
  while (!container.empty()) {
    if (!isFirst) {
      os << ", ";
    }
    if constexpr (concepts::FrontAccessible<T>) {
      printElement(os, container.front());
    } else if constexpr (concepts::TopAccessible<T>) {
      printElement(os, container.top());
    }
    container.pop();
    isFirst = false;
  }

  os << "]";
}

template <typename... Args>
void printElement(std::ostream &os, const std::tuple<Args...> &tpl) {
  os << "<";
  std::apply(
      [&os](const auto &...args) {
        // Counter to apply commas correctly
        std::size_t count = 0;
        std::size_t total = sizeof...(args);

        (
            [&] {
              printElement(os, args);
              if (++count < total) {
                os << ", ";
              }
            }(),
            ...);
      },
      tpl);
  os << ">";
}

template <concepts::SmartPointer SP>
void printElement(std::ostream &os, const SP &ptr) {
  if (ptr) {
    printElement(os, *ptr);
  } else {
    os << "nullptr";
  }
}

template <concepts::WeakPointer WP>
void printElement(std::ostream &os, const WP &ptr) {
  auto sp = ptr.lock();
  if (sp) {
    printElement(os, *sp);
  } else {
    os << "expired";
  }
}

template <typename T>
void printElement(std::ostream &os, const std::optional<T> &opt) {
  if (opt) {
    os << "Optional(";
    printElement(os, *opt);
    os << ")";
  } else {
    os << "nullopt";
  }
}

template <typename... Ts>
void printElement(std::ostream &os, const std::variant<Ts...> &var) {
  std::visit(
      [&os](const auto &value) {
        os << "Variant(";
        printElement(os, value);
        os << ")";
      },
      var);
}

void printElement(std::ostream &os, const std::error_code &ec) {
  os << "ErrorCode(" << ec.value() << ", " << ec.category().name() << ")";
}

void printElement(std::ostream &os, const std::exception_ptr &exPtr) {
  if (exPtr) {
    try {
      std::rethrow_exception(exPtr);
    } catch (const std::exception &ex) {
      os << "ExceptionPtr(\"" << ex.what() << "\")";
    } catch (...) {
      os << "ExceptionPtr(non-standard exception)";
    }
  } else {
    os << "nullptr";
  }
}

void printElement(std::ostream &os, const std::filesystem::path &path) {
  os << "Path(" << path << ")";
}

void printElement(std::ostream &os,
                  const std::filesystem::directory_iterator &dirIterator) {
  os << "Directory[";
  bool first = true;
  for (const auto &entry : dirIterator) {
    if (!first) {
      os << ", ";
    }
    os << entry.path().filename(); // Ensuring only filename is captured
    first = false;
  }
  os << "]";
}

// Fallback
template <concepts::Fallback UnsupportedArg>
void printElement(std::ostream &os, const UnsupportedArg &value) {
  const auto *typeName = typeid(UnsupportedArg).name();
  throw std::runtime_error(
      "Type "s + std::string(typeName) +
      "neither supports << operator for std::ostream nor is supported "
      "out-of-the-box in logging functionality."s);
}

} // namespace low_level_log_implementation

namespace rnexecutorch {

namespace high_level_log_implementation {

#ifdef __ANDROID__
android_LogPriority androidLogLevel(LOG_LEVEL logLevel) {
  switch (logLevel) {
  case LOG_LEVEL::Info:
    return ANDROID_LOG_INFO;
  case LOG_LEVEL::Error:
    return ANDROID_LOG_ERROR;
  case LOG_LEVEL::Debug:
    return ANDROID_LOG_DEBUG;
  default:
    return ANDROID_LOG_DEFAULT;
  }
}

void handleAndroidLog(LOG_LEVEL logLevel, const char *buffrer) {
  __android_log_print(androidLogLevel(logLevel), "RnExecutorch", "%s", buffrer);
}
#endif

#ifdef __APPLE__
void handleIosLog(LOG_LEVEL logLevel, const char *buffer) {
  switch (logLevel) {
  case LOG_LEVEL::Info:
    os_log_info(OS_LOG_DEFAULT, "%{public}s", buffer);
    return;
  case LOG_LEVEL::Error:
    os_log_error(OS_LOG_DEFAULT, "%{public}s", buffer);
    return;
  case LOG_LEVEL::Debug:
    os_log_debug(OS_LOG_DEFAULT, "%{public}s", buffer);
    return;
  }
}
#endif

std::string getBuffer(std::ostringstream &oss, std::size_t maxLogMessageSize) {
  const std::string fullMessage = oss.str();
  bool isMessageLongerThanLimit = fullMessage.size() > maxLogMessageSize;
  std::string buffer = fullMessage.substr(0, maxLogMessageSize);
  if (isMessageLongerThanLimit) {
    buffer += "...";
  }
  return buffer;
}

} // namespace high_level_log_implementation

template <std::size_t MaxLogSize, typename... Args>
void log(LOG_LEVEL logLevel, const Args &...args) {
  std::ostringstream oss;
  (low_level_log_implementation::printElement(oss, args),
   ...); // Fold expression used to handle all arguments

  const auto buffer = high_level_log_implementation::getBuffer(oss, MaxLogSize);
  const auto *cStyleBuffer = buffer.c_str();

#ifdef __ANDROID__
  high_level_log_implementation::handleAndroidLog(logLevel, cStyleBuffer);
#elif defined(__APPLE__)
  high_level_log_implementation::handleIosLog(logLevel, cStyleBuffer);
#else
  // Default log to cout if none of the above platforms
  std::cout << cStyleBuffer << std::endl;
#endif
}

} // namespace rnexecutorch