#pragma once
#include <cstdarg>
#include <cstdio>
#include <iostream>
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

namespace detail {
// To allow ADL with custom begin/end
using std::begin;
using std::end;

template <typename T>
concept is_iterable_impl = requires(T &t) {
  begin(t) != end(t);                     // begin/end and operator !=
  ++std::declval<decltype(begin(t)) &>(); // operator ++
  *begin(t);                              // operator*
};
} // namespace detail

template <typename T>
concept is_iterable = detail::is_iterable_impl<T>;

template <typename T>
concept is_streamable = requires(std::ostream &os, const T &t) {
  { os << t } -> std::convertible_to<std::ostream &>;
};

namespace rnexecutorch {

template <typename T>
  requires is_streamable<T>
void print_element(std::ostream &os, const T &value) {
  os << value;
}

// Forward declarations to guaratee template instantiations
template <typename T>
  requires is_iterable<T> && (!is_streamable<T>)
void print_element(std::ostream &os, const T &container);

template <typename T>
void print_element(std::ostream &os, const std::queue<T> &q);

template <typename... Args>
void print_element(std::ostream &os, const std::tuple<Args...> &tpl);

template <typename T, typename U>
void print_element(std::ostream &os, const std::pair<T, U> &p) {
  os << "(";
  print_element(os, p.first);
  os << ", ";
  print_element(os, p.second);
  os << ")";
}

template <typename T>
  requires is_iterable<T> && (!is_streamable<T>)
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
void print_element(std::ostream &os, const std::queue<T> &q) {
  std::queue<T> temp = q;
  os << "[";
  if (!temp.empty()) {
    print_element(os, temp.front());
    temp.pop();
  }
  while (!temp.empty()) {
    os << ", ";
    print_element(os, temp.front());
    temp.pop();
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

enum class LOG_LEVEL { Info, Error, Debug };

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

template <typename... Args> void log(LOG_LEVEL logLevel, const Args &...args) {
  std::ostringstream oss;
  (print_element(oss, args),
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