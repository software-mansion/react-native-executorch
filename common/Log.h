#pragma once

#include <cstdarg>
#include <string>

#ifdef __ANDROID__
#include <android/log.h>
#endif
#ifdef __APPLE__
#include <os/log.h>
#endif

namespace rnexecutorch {

enum LOG_LEVEL { INFO_LVL, ERROR_LVL, DEBUG_LVL };

#ifdef __ANDROID__
android_LogPriority androidLogLevel(LOG_LEVEL logLevel) {
  switch (logLevel) {
  case LOG_LEVEL::INFO_LVL:
  default:
    return ANDROID_LOG_INFO;
  case LOG_LEVEL::ERROR_LVL:
    return ANDROID_LOG_ERROR;
  case LOG_LEVEL::DEBUG_LVL:
    return ANDROID_LOG_DEBUG;
  }
}
#endif

// const char* instead of const std::string& as va_start doesn't take references
void log(LOG_LEVEL logLevel, const char *fmt, ...) {
  va_list args;
  va_start(args, fmt);

  // Maximum length of a log message.
  static constexpr size_t kMaxLogMessageLength = 256;
  char buf[kMaxLogMessageLength];
  size_t len = vsnprintf(buf, kMaxLogMessageLength, fmt, args);
  if (len >= kMaxLogMessageLength - 1) {
    buf[kMaxLogMessageLength - 2] = '$';
    len = kMaxLogMessageLength - 1;
  }
  buf[kMaxLogMessageLength - 1] = 0;

#ifdef __ANDROID__

  __android_log_print(androidLogLevel(logLevel), "RnExecutorch", "%s", buf);

#endif // ifdef __ANDROID__
#ifdef __APPLE__

  switch (logLevel) {
  case LOG_LEVEL::INFO_LVL:
  default:
    os_log_info(OS_LOG_DEFAULT, "%s", buf);
    break;
  case LOG_LEVEL::ERROR_LVL:
    os_log_error(OS_LOG_DEFAULT, "%s", buf);
    break;
  case LOG_LEVEL::DEBUG_LVL:
    os_log_debug(OS_LOG_DEFAULT, "%s", buf);
    break;
  }

#endif // ifdef __APPLE__
  va_end(args);
}

} // namespace rnexecutorch
