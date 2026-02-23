#pragma once

#include <cstddef>
#include <jsi/jsi.h>
#include <tuple>
#include <type_traits>

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
  return std::tuple<Types...>{
      jsi_conversion::getValue<Types>(args[I], runtime)...};
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

// Free function overload used by visionHostFunction: accepts a dummy free
// function pointer whose parameter types (Rest...) are extracted by
// TailSignature and converted from JSI args.
template <typename... Types>
std::tuple<Types...> createArgsTupleFromJsi(void (*f)(Types...),
                                            const jsi::Value *args,
                                            jsi::Runtime &runtime) {
  return fillTupleFromArgs<Types...>(std::index_sequence_for<Types...>{}, args,
                                     runtime);
}

// Extracts arity, return type, and argument types from a member function
// pointer at compile time. Used by visionHostFunction to determine the expected
// JS argument count and invoke the correct return path.
template <typename T> struct FunctionTraits;

template <typename R, typename C, typename... Args>
struct FunctionTraits<R (C::*)(Args...)> {
  static constexpr std::size_t arity = sizeof...(Args);
  using return_type = R;
  using args_tuple = std::tuple<Args...>;
};

template <typename R, typename C, typename... Args>
struct FunctionTraits<R (C::*)(Args...) const> {
  static constexpr std::size_t arity = sizeof...(Args);
  using return_type = R;
  using args_tuple = std::tuple<Args...>;
};

// Strips the first two parameters (Runtime& and jsi::Value&) from a member
// function pointer and exposes the remaining types as a dummy free function.
// Used by visionHostFunction to parse only the tail JS args via
// createArgsTupleFromJsi, while frameData at args[0] is passed manually.
template <typename T> struct TailSignature;

template <typename R, typename C, typename Arg1, typename Arg2,
          typename... Rest>
struct TailSignature<R (C::*)(Arg1, Arg2, Rest...)> {
  static void dummy(Rest...) {}
};

template <typename R, typename C, typename Arg1, typename Arg2,
          typename... Rest>
struct TailSignature<R (C::*)(Arg1, Arg2, Rest...) const> {
  static void dummy(Rest...) {}
};
} // namespace rnexecutorch::meta
