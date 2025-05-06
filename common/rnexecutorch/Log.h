#pragma once

namespace rnexecutorch {

enum LOG_LEVEL { INFO_LVL, ERROR_LVL, DEBUG_LVL };

// const char* instead of const std::string& as va_start doesn't take references
void log(LOG_LEVEL logLevel, const char *fmt, ...);

} // namespace rnexecutorch
