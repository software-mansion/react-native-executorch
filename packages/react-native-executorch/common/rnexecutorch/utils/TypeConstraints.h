#pragma once

#include <concepts>

namespace rnexecutorch {
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