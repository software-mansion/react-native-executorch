#pragma once

#include <concepts>
#include <type_traits>

namespace rnexecutorch {

template <typename T, typename Base>
concept DerivedFromOrSameAs = std::is_base_of_v<Base, T>;

template <typename T>
concept HasGenerate = requires(T t) {
  { &T::generate };
};

// When i make BaseModel have all of this methods we can then just check from
// is_base_of instead of doing this for every single method
template <typename T>
concept HasForward = requires(T t) {
  { &T::forward };
};

template <typename T>
concept HasMethodNames = requires(T t) {
  { &T::methodNames };
};

template <typename T>
concept HasGetInputShape = requires(T t) {
  { &T::getInputShape };
};

template <typename T>
concept HasIsLoaded = requires(T t) {
  { &T::isLoaded };
};

template <typename T>
concept UnloadableExternalMemoryAware = requires(T t) {
  { t.unload() } -> std::same_as<void>;
  { t.getMemoryLowerBound() } -> std::same_as<std::size_t>;
};

} // namespace rnexecutorch