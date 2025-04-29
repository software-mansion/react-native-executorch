#pragma once

#include <jsi/jsi.h>
#include <type_traits>

namespace rnexecutorch::jsiconversion {

using namespace facebook;

// Conversion from jsi to C++ types --------------------------------------------

template <typename T> T getValue(const jsi::Value &val, jsi::Runtime &runtime);

template <>
double getValue<double>(const jsi::Value &val, jsi::Runtime &runtime) {
  return val.asNumber();
}

template <> bool getValue<bool>(const jsi::Value &val, jsi::Runtime &runtime) {
  return val.asBool();
}

template <>
std::string getValue<std::string>(const jsi::Value &val,
                                  jsi::Runtime &runtime) {
  return val.getString(runtime).utf8(runtime);
}

template <>
std::vector<std::string>
getValue<std::vector<std::string>>(const jsi::Value &val,
                                   jsi::Runtime &runtime) {
  jsi::Array array = val.asObject(runtime).asArray(runtime);
  size_t length = array.size(runtime);
  std::vector<std::string> result;
  result.reserve(length);

  for (size_t i = 0; i < length; ++i) {
    jsi::Value element = array.getValueAtIndex(runtime, i);
    result.push_back(getValue<std::string>(element, runtime));
  }
  return result;
}

// Conversion from C++ types to jsi --------------------------------------------

// Implementation functions might return any type, but in a promise we can only
// return jsi::Value or jsi::Object. For each type being returned
// we add a function here.

// Identity function for the sake of completeness
jsi::Value getJsiValue(jsi::Value &&value, jsi::Runtime &runtime) {
  return std::move(value);
}

jsi::Value getJsiValue(jsi::Object &&value, jsi::Runtime &runtime) {
  return jsi::Value(std::move(value));
}

jsi::Value getJsiValue(const std::string &str, jsi::Runtime &runtime) {
  return jsi::String::createFromAscii(runtime, str);
}

template <typename Model, typename R, typename... Types>
constexpr std::size_t getArgumentCount(R (Model::*f)(Types...)) {
  return sizeof...(Types);
}

template <typename... Types, std::size_t... I>
std::tuple<Types...> fillTupleFromArgs(std::index_sequence<I...>,
                                       const jsi::Value *args,
                                       jsi::Runtime &runtime) {
  return std::make_tuple(getValue<Types>(args[I], runtime)...);
}

template <typename Model, typename R, typename... Types>
std::tuple<Types...> createArgsTupleFromJsi(R (Model::*f)(Types...),
                                            const jsi::Value *args,
                                            jsi::Runtime &runtime) {
  return fillTupleFromArgs<Types...>(std::index_sequence_for<Types...>{}, args,
                                     runtime);
}

} // namespace rnexecutorch::jsiconversion