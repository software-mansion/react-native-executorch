#pragma once

#include <cstddef>
#include <jsi/jsi.h>
#include <tuple>

#include <rnexecutorch/host_objects/JsiConversions.h>

namespace rnexecutorch::meta {
using namespace facebook;

template <typename Model, typename R, typename... Types>
constexpr std::size_t getArgumentCount(R (Model::*f)(Types...)) {
  return sizeof...(Types);
}

template <typename Model, typename R, typename... Types>
constexpr std::size_t getArgumentCount(R (Model::*f)(Types...) const) {
  return sizeof...(Types);
}

template <typename... Types, std::size_t... I>
std::tuple<Types...> fillTupleFromArgs(std::index_sequence<I...>,
                                       const jsi::Value *args,
                                       jsi::Runtime &runtime) {
  return std::make_tuple(jsi_conversion::getValue<Types>(args[I], runtime)...);
}

/**
 * createArgsTupleFromJsi creates a tuple that can be used as a collection of
 * arguments for method supplied with a pointer. The types in the tuple are
 * inferred from the method pointer.
 */

template <typename Model, typename R, typename... Types>
std::tuple<Types...> createArgsTupleFromJsi(R (Model::*f)(Types...),
                                            const jsi::Value *args,
                                            jsi::Runtime &runtime) {
  return fillTupleFromArgs<Types...>(std::index_sequence_for<Types...>{}, args,
                                     runtime);
}

template <typename Model, typename R, typename... Types>
std::tuple<Types...> createArgsTupleFromJsi(R (Model::*f)(Types...) const,
                                            const jsi::Value *args,
                                            jsi::Runtime &runtime) {
  return fillTupleFromArgs<Types...>(std::index_sequence_for<Types...>{}, args,
                                     runtime);
}
} // namespace rnexecutorch::meta