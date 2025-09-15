#pragma once
#include <cstdint>
#include <exception>
#include <filesystem>
#include <ios>
#include <iostream>
#include <iterator>
#include <memory>
#include <optional>
#include <sstream>
#include <string>
#include <system_error>
#include <tuple>
#include <type_traits>
#include <utility>
#include <variant>

#ifdef __ANDROID__
#include <android/log.h>
#endif
#ifdef __APPLE__
#include <os/log.h>
#endif

namespace low_level_log_implementation {

using namespace std::string_literals;

namespace concepts {
template <typename T>
concept Iterable = requires(const T &t) {
  { std::begin(t) } -> std::input_or_output_iterator;
  { std::end(t) } -> std::input_or_output_iterator;
};

template <typename T>
concept FrontAccessible = requires(T t) {
  { t.front() };
  requires !std::is_void_v<decltype(t.front())>;
};

template <typename T>
concept TopAccessible = requires(T t) {
  { t.top() };
  requires !std::is_void_v<decltype(t.top())>;
};

template <typename T>
concept HasPop = requires(T t) {
  { t.pop() };
};

template <typename T>
concept HasEmpty = requires(const T &t) {
  { t.empty() } -> std::same_as<bool>;
};

// These two below are needed apart from TopAccessible and FrontAccessible
// to guarantee that correct templated is matched
template <typename T>
concept ReadOnlySequencableFront = requires(const T &t) {
  { t.front() } -> std::same_as<const typename T::value_type &>;
} && HasEmpty<T> && !Iterable<T>;

template <typename T>
concept ReadOnlySequencableTop = requires(const T &t) {
  { t.top() } -> std::same_as<const typename T::value_type &>;
} && HasEmpty<T> && !Iterable<T>;

template <typename T>
concept ReadOnlySequencable =
    ReadOnlySequencableFront<T> || ReadOnlySequencableTop<T>;

template <typename T>
concept MutableSequencable = ReadOnlySequencable<T> && HasPop<T>;

template <typename T>
concept Streamable = requires(std::ostream &os, const T &t) {
  { os << t } -> std::convertible_to<std::ostream &>;
};

template <typename T>
concept SmartPointer = requires(const T &a) {
  *a;
  { a ? true : false } -> std::convertible_to<bool>;
} && !std::is_pointer_v<T>; // Ensure that it's not a raw pointer

template <typename T>
concept WeakPointer = requires(const T &a) {
  {
    a.lock()
  } -> std::convertible_to<
      std::shared_ptr<typename T::element_type>>; // Verifies if a.lock() can
                                                  // convert to std::shared_ptr
};

template <typename T>
concept Fallback =
    !Iterable<T> && !Streamable<T> && !SmartPointer<T> && !WeakPointer<T> &&
    !ReadOnlySequencable<T> && !MutableSequencable<T>;

} // namespace concepts

template <typename T>
  requires concepts::Streamable<T> && (!concepts::SmartPointer<T>)
void printElement(std::ostream &os, const T &value);

template <typename T, typename U>
void printElement(std::ostream &os, const std::pair<T, U> &p);

template <std::size_t N>
void printElement(std::ostream &os, const char (&array)[N]);

template <typename T, std::size_t N>
void printElement(std::ostream &os, T (&array)[N]);

template <typename T>
  requires concepts::Iterable<T> && (!concepts::Streamable<T>)
void printElement(std::ostream &os, const T &container);

template <typename T> void printSequencable(std::ostream &os, T &&container);

template <typename T>
  requires concepts::ReadOnlySequencable<T>
void printElement(std::ostream &os, const T &container);

template <typename T>
  requires concepts::MutableSequencable<T>
void printElement(std::ostream &os, T &&container);

template <typename... Args>
void printElement(std::ostream &os, const std::tuple<Args...> &tpl);

template <concepts::SmartPointer SP>
void printElement(std::ostream &os, const SP &ptr);

template <concepts::WeakPointer WP>
void printElement(std::ostream &os, const WP &ptr);

template <typename T>
void printElement(std::ostream &os, const std::optional<T> &opt);

template <typename... Ts>
void printElement(std::ostream &os, const std::variant<Ts...> &var);

void printElement(std::ostream &os, const std::exception_ptr &exPtr);

void printElement(std::ostream &os, const std::filesystem::path &path);

void printElement(std::ostream &os,
                  const std::filesystem::directory_iterator &dir_it);

template <concepts::Fallback UnsupportedArg>
void printElement(std::ostream &os, const UnsupportedArg &value);

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
    if (i > 0) {
      os << ", ";
    }
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

template <typename T> void printSequencable(std::ostream &os, T &&container) {
  os << "[";
  bool isFirst = true;

  auto printElementLambda = [&isFirst, &os](auto &&element) {
    if (!isFirst) {
      os << ", ";
    }
    low_level_log_implementation::printElement(
        os, std::forward<decltype(element)>(element));
    isFirst = false;
  };

  while (!container.empty()) {
    if constexpr (concepts::FrontAccessible<T>) {
      printElementLambda(container.front());
    } else if constexpr (concepts::TopAccessible<T>) {
      printElementLambda(container.top());
    }
    container.pop();
  }

  os << "]";
}

template <typename T>
  requires concepts::ReadOnlySequencable<T>
void printElement(std::ostream &os, const T &container) {
  T tempContainer = container; // Make a copy to preserve original container
  printSequencable(
      os, std::move(tempContainer)); // Use std::move since tempContainer won't
                                     // be used again
}

template <typename T>
  requires concepts::MutableSequencable<T>
void printElement(std::ostream &os, T &&container) {
  printSequencable(os, std::forward<T>(container));
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

inline void printElement(std::ostream &os, const std::error_code &ec) {
  os << "ErrorCode(" << ec.value() << ", " << ec.category().name() << ")";
}

inline void printElement(std::ostream &os, const std::exception_ptr &exPtr) {
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

inline void printElement(std::ostream &os, const std::filesystem::path &path) {
  os << "Path(" << path << ")";
}

inline void
printElement(std::ostream &os,
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

/**
 * @enum LogLevel
 * @brief Represents various levels of logging severity.
 *
 * This `enum class` is used to specify the severity of a log message. This
 * helps in filtering logs according to their importance and can be crucial for
 * debugging and monitoring applications.
 */
enum class LOG_LEVEL : uint8_t {
  Info,  /**< Informational messages that highlight the progress of the
            application. */
  Error, /**< Error events of considerable importance that will prevent normal
            program execution. */
  Debug  /**< Detailed information, typically of interest only when diagnosing
            problems. */
};

namespace high_level_log_implementation {

#ifdef __ANDROID__
inline android_LogPriority androidLogLevel(LOG_LEVEL logLevel) {
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

inline void handleAndroidLog(LOG_LEVEL logLevel, const char *buffer) {
  __android_log_print(androidLogLevel(logLevel), "RnExecutorch", "%s", buffer);
}
#endif

#ifdef __APPLE__
inline void handleIosLog(LOG_LEVEL logLevel, const char *buffer) {
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

inline std::string getBuffer(const std::string &logMessage,
                             std::size_t maxLogMessageSize) {
  if (logMessage.size() > maxLogMessageSize) {
    return logMessage.substr(0, maxLogMessageSize) + "...";
  }
  return logMessage;
}

inline std::ostringstream createConfiguredOutputStream() {
  std::ostringstream oss;
  oss << std::boolalpha;
  return oss;
}

} // namespace high_level_log_implementation

/**
 * @brief Logs given data on a console
 * @details
 * The function takes logging level and variety of data types:
 * - Every data type that implements `operator<<` for `std::ostream`
 * - All STL constainers available in C++20
 * - Static arrays
 * - Smart pointers, `std::variant`, and `std::optional`
 * - `std::tuple` and `std::pair`
 * - `std::error_code` and `std::exception_ptr`
 * - `std::filesystem::path` and `std::filesystem::directory_iterator`
 * - Every combination for mentioned above like `std::vector<std::set<int>>`
 *
 * You can manipulate size of the log message. By default it is set to 1024
 * characters. To change this, specify the template argument like so:
 * @code{.cpp}
 * log<2048>(LOG_LEVEL::Info, longMsg);
 * @endcode
 * @param logLevel logging level - one of `LOG_LEVEL` enum class value: `Info`,
 * `Error`, and `Debug`.
 * @tparam Args Data to be logged.
 * @tparam MaxLogSize Maximal size of log in characters.
 * @par Returns
 *    Nothing.
 */
template <std::size_t MaxLogSize = 1024, typename... Args>
void log(LOG_LEVEL logLevel, Args &&...args) {
  auto oss = high_level_log_implementation::createConfiguredOutputStream();
  auto space = [&oss](auto &&arg) {
    low_level_log_implementation::printElement(
        oss, std::forward<decltype(arg)>(arg));
    oss << ' ';
  };

  (..., space(std::forward<Args>(args)));

  // Remove the extra space after the last element
  std::string output = oss.str();
  if (!output.empty()) {
    output.pop_back();
  }

  const auto buffer =
      high_level_log_implementation::getBuffer(output, MaxLogSize);
  const auto *cStyleBuffer = buffer.c_str();

#ifdef __ANDROID__
  high_level_log_implementation::handleAndroidLog(logLevel, cStyleBuffer);
#elif defined(__APPLE__)
  high_level_log_implementation::handleIosLog(logLevel, cStyleBuffer);
#else
  // Default log to cout if none of the above platforms
  std::cout << cStyleBuffer << '\n';
#endif
}

} // namespace rnexecutorch
