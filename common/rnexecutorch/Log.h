#pragma once

namespace rnexecutorch {

enum class LOG_LEVEL { INFO, ERROR, DEBUG };

// const char* instead of const std::string& as va_start doesn't take references
void log(LOG_LEVEL logLevel, const char *fmt, ...);

} // namespace rnexecutorch
