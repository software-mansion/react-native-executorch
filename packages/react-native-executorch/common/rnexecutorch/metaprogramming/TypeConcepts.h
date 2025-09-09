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
concept HasTranscribe = requires(T t) {
  { &T::transcribe };
};

template <typename T>
concept HasStream = requires(T t) {
  { &T::stream };
};

template <typename T>
concept HasStreamInsert = requires(T t) {
  { &T::streamInsert };
};

template <typename T>
concept HasStreamStop = requires(T t) {
  { &T::streamStop };
};

template <typename T>
concept IsNumeric = std::is_arithmetic_v<T>;

template <typename T>
concept ProvidesMemoryLowerBound = requires(T t) {
  { &T::getMemoryLowerBound };
};

} // namespace rnexecutorch::meta
