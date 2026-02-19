#pragma once

#include <cstddef>
#include <jsi/jsi.h>
#include <tuple>
#include <type_traits>

#include <rnexecutorch/host_objects/JsiConversions.h>

namespace rnexecutorch::meta {
using namespace facebook;

// =========================================================================
// 1. Function Traits (Extracts Arity, Return Type, Args)
// =========================================================================

template <typename T> struct FunctionTraits;

// Specialization for Member Functions
template <typename R, typename C, typename... Args>
struct FunctionTraits<R (C::*)(Args...)> {
  static constexpr std::size_t arity = sizeof...(Args);
  using return_type = R;
  using args_tuple = std::tuple<Args...>;
};

// Specialization for const Member Functions
template <typename R, typename C, typename... Args>
struct FunctionTraits<R (C::*)(Args...) const> {
  static constexpr std::size_t arity = sizeof...(Args);
  using return_type = R;
  using args_tuple = std::tuple<Args...>;
};

// =========================================================================
// 2. Argument Counting Helpers
// =========================================================================

template <typename Model, typename R, typename... Types>
constexpr std::size_t getArgumentCount(R (Model::*f)(Types...)) {
  return sizeof...(Types);
}

template <typename Model, typename R, typename... Types>
constexpr std::size_t getArgumentCount(R (Model::*f)(Types...) const) {
  return sizeof...(Types);
}

// =========================================================================
// 3. JSI -> Tuple Conversion Logic
// =========================================================================

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

// Overload for free functions (used by TailSignature dummy)
template <typename... Types>
std::tuple<Types...> createArgsTupleFromJsi(void (*f)(Types...),
                                            const jsi::Value *args,
                                            jsi::Runtime &runtime) {
  return fillTupleFromArgs<Types...>(std::index_sequence_for<Types...>{}, args,
                                     runtime);
}

// =========================================================================
// 4. Tail Signature Helper (Crucial for Vision Functions)
// =========================================================================

// Extracts the "Tail" arguments of a function signature, skipping the first
// two arguments (Runtime and FrameValue).
template <typename T> struct TailSignature;

// Non-const member function specialization
template <typename R, typename C, typename Arg1, typename Arg2,
          typename... Rest>
struct TailSignature<R (C::*)(Arg1, Arg2, Rest...)> {
  // A dummy function that has the signature of just the "Rest" arguments.
  static void dummy(Rest...) {}
};

// Const member function specialization
template <typename R, typename C, typename Arg1, typename Arg2,
          typename... Rest>
struct TailSignature<R (C::*)(Arg1, Arg2, Rest...) const> {
  static void dummy(Rest...) {}
};

} // namespace rnexecutorch::meta
