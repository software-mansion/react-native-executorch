#pragma once
#include <cstdarg>
#include <cstdio>
#include <iostream>
#include <iterator>
#include <map>
#include <queue>
#include <set>
#include <sstream>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#ifdef __ANDROID__
#include <android/log.h>
#endif
#ifdef __APPLE__
#include <os/log.h>
#endif

// Replace using this one

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

namespace log_implementation {

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
void print_element(std::ostream &os, const T &value);

template <typename T, typename U>
void print_element(std::ostream &os, const std::pair<T, U> &p);

template <typename T>
  requires Iterable<T> && (!Streamable<T>)
void print_element(std::ostream &os, const T &container);

template <typename T>
  requires Sequencable<T>
void print_element(std::ostream &os, T container);

template <typename... Args>
void print_element(std::ostream &os, const std::tuple<Args...> &tpl);

template <typename T>
  requires Streamable<T>
void print_element(std::ostream &os, const T &value) {
  os << value;
}

template <typename T, typename U>
void print_element(std::ostream &os, const std::pair<T, U> &p) {
  os << "(";
  print_element(os, p.first);
  os << ", ";
  print_element(os, p.second);
  os << ")";
}

template <typename T>
  requires Iterable<T> && (!Streamable<T>)
void print_element(std::ostream &os, const T &container) {
  os << "[";
  auto it = std::begin(container);
  if (it != std::end(container)) {
    print_element(os, *it++);
    for (; it != std::end(container); ++it) {
      os << ", ";
      print_element(os, *it);
    }
  }
  os << "]";
}

template <typename T>
  requires Sequencable<T>
void print_element(
    std::ostream &os,
    T container) { // pass by value to avoid modifying the original
  os << "[";
  if (!container.empty()) {
    if constexpr (FrontAccessible<T>) {
      print_element(os, container.front());
    } else if constexpr (TopAccessible<T>) {
      print_element(os, container.top());
    }
    container.pop();

    while (!container.empty()) {
      os << ", ";
      if constexpr (FrontAccessible<T>) {
        print_element(os, container.front());
      } else if constexpr (TopAccessible<T>) {
        print_element(os, container.top());
      }
      container.pop();
    }
  }
  os << "]";
}

template <typename... Args>
void print_element(std::ostream &os, const std::tuple<Args...> &tpl) {
  os << "<";
  std::apply(
      [&os](const auto &...args) {
        // Counter to apply commas correctly
        size_t count = 0;
        size_t total = sizeof...(args);

        (
            [&] {
              print_element(os, args);
              if (++count < total) {
                os << ", ";
              }
            }(),
            ...);
      },
      tpl);
  os << ">";
}

} // namespace log_implementation

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
#endif

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
  (log_implementation::print_element(oss, args),
   ...); // Fold expression used to handle all arguments

  constexpr size_t log_size = 1024;
  const std::string full_message = oss.str();
  bool is_message_longer_than_limit = full_message.size() > log_size;
  std::string buf = full_message.substr(0, log_size);
  if (is_message_longer_than_limit) {
    buf += "...";
  }
  const auto cbuf = buf.c_str();

#ifdef __ANDROID__
  __android_log_print(androidLogLevel(logLevel), "RnExecutorch", "%s", cbuf);
#elif defined(__APPLE__)
  switch (logLevel) {
  case LOG_LEVEL::Info:
    os_log_info(OS_LOG_DEFAULT, "%{public}s", cbuf);
    break;
  case LOG_LEVEL::Error:
    os_log_error(OS_LOG_DEFAULT, "%{public}s", cbuf);
    break;
  case LOG_LEVEL::Debug:
    os_log_debug(OS_LOG_DEFAULT, "%{public}s", cbuf);
    break;
  }
#else
  std::cout << cbuf
            << std::endl; // Default log to cout if none of the above platforms
#endif
}

} // namespace rnexecutorch