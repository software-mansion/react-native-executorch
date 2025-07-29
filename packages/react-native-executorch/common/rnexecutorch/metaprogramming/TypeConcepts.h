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

} // namespace rnexecutorch::meta