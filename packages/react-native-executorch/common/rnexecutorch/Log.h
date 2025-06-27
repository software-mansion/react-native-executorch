#pragma once
#include <cstdarg>
#include <cstdio>
#include <iostream>
#include <iterator>
#include <sstream>
#include <tuple>
#include <type_traits>
#include <utility>

#ifdef __ANDROID__
#include <android/log.h>
#endif
#ifdef __APPLE__
#include <os/log.h>
#endif

namespace low_level_log_implementation {
namespace concept_detail {
// ADL-based begin/end detection with backup to standard begin/end
using std::begin;
using std::end;

template <typename T, typename = void>
struct has_begin_end : std::false_type {};

template <typename T>
struct has_begin_end<T, std::void_t<decltype(begin(std::declval<T>())),
                                    decltype(end(std::declval<T>()))>>
    : std::true_type {};

template <typename T>
inline constexpr bool has_begin_end_v = has_begin_end<T>::value;

template <typename T, typename = void> struct has_front : std::false_type {};

template <typename T>
struct has_front<T, std::void_t<decltype(std::declval<T>().front())>>
    : std::true_type {};

template <typename T, typename = void> struct has_top : std::false_type {};

template <typename T>
struct has_top<T, std::void_t<decltype(std::declval<T>().top())>>
    : std::true_type {};

template <typename T, typename = void> struct has_pop : std::false_type {};

template <typename T>
struct has_pop<T, std::void_t<decltype(std::declval<T>().pop())>>
    : std::true_type {};

} // namespace concept_detail

template <typename T>
concept Iterable = concept_detail::has_begin_end_v<T> && requires(T &t) {
  ++std::declval<decltype(begin(t)) &>(); // Support for increment
  *begin(t);                              // Support for dereferencing
};

template <typename T>
concept FrontAccessible = concept_detail::has_front<T>::value;

template <typename T>
concept TopAccessible = concept_detail::has_top<T>::value;

template <typename T>
concept Sequencable = concept_detail::has_pop<T>::value &&
                      (FrontAccessible<T> || TopAccessible<T>);

template <typename T>
concept Streamable = requires(std::ostream &os, const T &t) {
  { os << t } -> std::convertible_to<std::ostream &>;
};

template <typename T>
  requires Streamable<T>
void printElement(std::ostream &os, const T &value);

template <typename T, typename U>
void printElement(std::ostream &os, const std::pair<T, U> &p);

template <typename T>
  requires Iterable<T> && (!Streamable<T>)
void printElement(std::ostream &os, const T &container);

template <typename T>
  requires Sequencable<T>
void printElement(std::ostream &os, T container);

template <typename... Args>
void printElement(std::ostream &os, const std::tuple<Args...> &tpl);

void printElement(std::ostream &os, bool value) {
  os << (value ? "true" : "false");
}

template <typename T>
  requires Streamable<T>
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

template <typename T>
  requires Iterable<T> && (!Streamable<T>)
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
  requires Sequencable<T>
void printElement(
    std::ostream &os,
    T container) { // Pass by value to prevent modifications to the original
  os << "[";

  bool isFirst = true;
  while (!container.empty()) {
    if (!isFirst) {
      os << ", ";
    }
    if constexpr (FrontAccessible<T>) {
      printElement(os, container.front());
    } else if constexpr (TopAccessible<T>) {
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
        size_t count = 0;
        size_t total = sizeof...(args);

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

} // namespace low_level_log_implementation

namespace rnexecutorch {

/**
 * @enum LogLevel
 * @brief Represents various levels of logging severity.
 *
 * This `enum class` is used to specify the severity of a log message. This
 * helps in filtering logs according to their importance and can be crucial for
 * debugging and monitoring applications.
 */
enum class LOG_LEVEL {
  Info,  /**< Informational messages that highlight the progress of the
            application. */
  Error, /**< Error events of considerable importance that will prevent normal
            program execution. */
  Debug  /**< Detailed information, typically of interest only when diagnosing
            problems. */
};

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

std::string getBuffer(std::ostringstream &oss) {
  constexpr size_t maxLogMessageSize = 1024;
  const std::string fullMessage = oss.str();
  bool isMessageLongerThanLimit = fullMessage.size() > maxLogMessageSize;
  std::string buffer = fullMessage.substr(0, maxLogMessageSize);
  if (isMessageLongerThanLimit) {
    buffer += "...";
  }
  return buffer;
}

} // namespace high_level_log_implementation

/**
 * @brief Logs given data on a console
 *
 * The function takes logging level and arbitrary data type that implements `<<`
 * operator for `std::ostream` or STL container with such data type.
 *
 * @param logLevel logging level - one of `LOG_LEVEL` enum class value: `Info`,
 * `Error`, and `Debug`.
 * @param args Data to be logged.
 * @return Function does not return, only prints to console.
 */
template <typename... Args> void log(LOG_LEVEL logLevel, const Args &...args) {
  std::ostringstream oss;
  (low_level_log_implementation::printElement(oss, args),
   ...); // Fold expression used to handle all arguments

  const auto buffer = high_level_log_implementation::getBuffer(oss);
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