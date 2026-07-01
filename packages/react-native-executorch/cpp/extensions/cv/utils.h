#pragma once

#include "core/dtype.h"
#include <jsi/jsi.h>
#include <opencv2/core.hpp>
#include <stdexcept>
#include <string>

namespace rnexecutorch::extensions::cv {

inline int dtypeToCvDepth(rnexecutorch::core::types::DType dtype) {
    switch (dtype) {
    case rnexecutorch::core::types::DType::uint8:
        return CV_8U;
    case rnexecutorch::core::types::DType::int32:
        return CV_32S;
    case rnexecutorch::core::types::DType::float32:
        return CV_32F;
    }
    throw std::invalid_argument("unsupported dtype");
}

// ------------------------------ JSI option readers ------------------------------
// Required option getters shared by the cv op installers. Defaults live in the TS
// wrappers, so a missing/mis-typed property is a contract violation -> throw.
inline double getNumberProp(facebook::jsi::Runtime &rt, const facebook::jsi::Object &opts,
                            const char *name) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isNumber()) {
        throw facebook::jsi::JSError(rt, std::string("options.") + name +
                                             " is required and must be a number");
    }
    return opts.getProperty(rt, name).asNumber();
}

inline std::string getStringProp(facebook::jsi::Runtime &rt, const facebook::jsi::Object &opts,
                                 const char *name) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isString()) {
        throw facebook::jsi::JSError(rt, std::string("options.") + name +
                                             " is required and must be a string");
    }
    return opts.getProperty(rt, name).asString(rt).utf8(rt);
}

inline bool getBoolProp(facebook::jsi::Runtime &rt, const facebook::jsi::Object &opts,
                        const char *name) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isBool()) {
        throw facebook::jsi::JSError(rt, std::string("options.") + name +
                                             " is required and must be a boolean");
    }
    return opts.getProperty(rt, name).asBool();
}

// Optional boolean (defaults when absent) — used for flags a caller may omit.
inline bool getBoolPropOr(facebook::jsi::Runtime &rt, const facebook::jsi::Object &opts,
                          const char *name, bool fallback) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isBool()) {
        return fallback;
    }
    return opts.getProperty(rt, name).asBool();
}

} // namespace rnexecutorch::extensions::cv
