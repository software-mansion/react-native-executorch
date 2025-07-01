#pragma once
#include <cstdint>
#include <exception>
#include <filesystem>
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
concept HasBeginEnd = requires(T t) {
  { std::begin(t) } -> std::convertible_to<decltype(std::begin(t))>;
  { std::end(t) } -> std::convertible_to<decltype(std::end(t))>;
};

template <typename T>
concept FrontAccessible = requires(T t) {
  { t.front() } -> std::convertible_to<decltype(t.front())>;
};

template <typename T>
concept TopAccessible = requires(T t) {
  { t.top() } -> std::convertible_to<decltype(t.top())>;
};

template <typename T>
concept HasPop = requires(T t) {
  { t.pop() } -> std::same_as<void>;
};

template <typename T>
concept Iterable = HasBeginEnd<T> && requires(T &t) {
  ++std::declval<decltype(begin(t)) &>(); // Support for increment
  *begin(t);                              // Support for dereferencing
};

template <typename T>
concept Sequencable = HasPop<T> && (FrontAccessible<T> || TopAccessible<T>);

template <typename T>
concept Streamable = requires(std::ostream &os, const T &t) {
  { os << t } -> std::convertible_to<std::ostream &>;
};

template <typename T>
concept SmartPointer = requires(T a) {
  *a;
  { a ? true : false } -> std::convertible_to<bool>;
} && !std::is_pointer_v<T>; // Ensure that it's not a raw pointer

template <typename T>
concept WeakPointer = requires(T a) {
  {
    a.lock()
  } -> std::convertible_to<
      std::shared_ptr<typename T::element_type>>; // Verifies if a.lock() can
                                                  // convert to std::shared_ptr
};

template <typename T>
concept Fallback = !Iterable<T> && !Sequencable<T> && !Streamable<T> &&
                   !SmartPointer<T> && !WeakPointer<T>;

} // namespace concepts

void printElement(std::ostream &os, bool value);

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

template <typename T>
  requires concepts::Sequencable<T>
void printElement(std::ostream &os, T container);

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
android_LogPriority androidLogLevel(LOG_LEVEL logLevel);
void handleAndroidLog(LOG_LEVEL logLevel, const char *buffrer);
#endif

#ifdef __APPLE__
void handleIosLog(LOG_LEVEL logLevel, const char *buffer);
#endif

std::string getBuffer(std::ostringstream &oss, std::size_t maxLogMessageSize);

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
void log(LOG_LEVEL logLevel, const Args &...args);

} // namespace rnexecutorch

#include "Log.cpp"
