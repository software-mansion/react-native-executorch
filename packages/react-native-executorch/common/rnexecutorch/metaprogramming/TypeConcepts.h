#pragma once

#include <concepts>
#include <type_traits>

namespace rnexecutorch::meta {
template <typename T, typename Base>
concept DerivedFromOrSameAs = std::is_base_of_v<Base, T>;

template <typename T, typename Base>
concept SameAs = std::is_same_v<Base, T>;

template <typename T>
concept HasGenerate = requires(T t) {
  { &T::generate };
};

template <typename T>
concept HasEncode = requires(T t) {
  { &T::encode };
};

template <typename T>
concept HasDecode = requires(T t) {
  { &T::decode };
};

template <typename T>
concept IsNumeric = std::is_arithmetic_v<T>;

template <typename T>
concept ProvidesMemoryLowerBound = requires(T t) {
  { &T::getMemoryLowerBound };
};

// ---------------------------------------------------------
// FunctionTraits
// ---------------------------------------------------------
template <typename T> struct FunctionTraits;

// 1. Specialization for Member Function Pointers (You already had this)
template <typename R, typename C, typename... Args>
struct FunctionTraits<R (C::*)(Args...)> {
  static constexpr std::size_t arity = sizeof...(Args);
  using return_type = R;
  template <std::size_t I> struct arg {
    using type = typename std::tuple_element<I, std::tuple<Args...>>::type;
  };
};

// 2. ✅ NEW: Specialization for Free/Static Function Pointers
// (Required for TailSignature::dummy)
template <typename R, typename... Args> struct FunctionTraits<R (*)(Args...)> {
  static constexpr std::size_t arity = sizeof...(Args);
  using return_type = R;
  template <std::size_t I> struct arg {
    using type = typename std::tuple_element<I, std::tuple<Args...>>::type;
  };
};

// ---------------------------------------------------------
// TailSignature Helper
// ---------------------------------------------------------
template <typename T> struct TailSignature;

template <typename R, typename C, typename Arg0, typename Arg1,
          typename... Rest>
struct TailSignature<R (C::*)(Arg0, Arg1, Rest...)> {
  // A dummy function that takes only the "Rest" arguments
  static void dummy(Rest...) {}
};
} // namespace rnexecutorch::meta
