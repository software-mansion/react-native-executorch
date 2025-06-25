// #include "Log.h"

// #include <cstdarg>
// #include <cstdio>

// #ifdef __ANDROID__
// #include <android/log.h>
// #endif
// #ifdef __APPLE__
// #include <os/log.h>
// #endif

// namespace rnexecutorch {

// #ifdef __ANDROID__
// android_LogPriority androidLogLevel(LOG_LEVEL logLevel) {
//   switch (logLevel) {
//   case LOG_LEVEL::Info:
//   default:
//     return ANDROID_LOG_INFO;
//   case LOG_LEVEL::Error:
//     return ANDROID_LOG_ERROR;
//   case LOG_LEVEL::Debug:
//     return ANDROID_LOG_DEBUG;
//   }
// }
// #endif

// void log(LOG_LEVEL logLevel, const char *fmt, ...) {
//   va_list args;
//   va_start(args, fmt);

//   // Maximum length of a log message.
//   static constexpr size_t kMaxLogMessageLength = 1024;
//   char buf[kMaxLogMessageLength];
//   size_t len = vsnprintf(buf, kMaxLogMessageLength, fmt, args);
//   if (len >= kMaxLogMessageLength - 1) {
//     for (std::size_t i = 0; i < 3; ++i)
//       buf[kMaxLogMessageLength - 2 - i] = '.';
//     len = kMaxLogMessageLength - 3;
//   }
//   buf[kMaxLogMessageLength - 1] = 0;

// #ifdef __ANDROID__

//   __android_log_print(androidLogLevel(logLevel), "RnExecutorch", "%s", buf);

// #endif // ifdef __ANDROID__
// #ifdef __APPLE__

//   switch (logLevel) {
//   case LOG_LEVEL::Info:
//   default:
//     os_log_info(OS_LOG_DEFAULT, "%s", buf);
//     break;
//   case LOG_LEVEL::Error:
//     os_log_error(OS_LOG_DEFAULT, "%s", buf);
//     break;
//   case LOG_LEVEL::Debug:
//     os_log_debug(OS_LOG_DEFAULT, "%s", buf);
//     break;
//   }

// #endif // ifdef __APPLE__
//   va_end(args);
// }

// } // namespace rnexecutorch