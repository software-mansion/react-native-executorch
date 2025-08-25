#pragma once

#include <concepts>
#include <jsi/jsi.h>
#include <memory>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <tuple>
#include <type_traits>

namespace facebook::react {
class CallInvoker;
}

namespace rnexecutorch {
namespace meta {

using namespace facebook;

/**
 * To be able to generically invoke constructors, we need to know what types
 * are the arguments that need to be passed to it. To do this, we specialize the
 * ConstructorTraits struct template for each class which constructor we want to
 * use. See REGISTER_CONSTRUCTOR macro for a easy way to do this.
 *
 * Note: a downside for this method is that we can specialize ConstructorTraits
 * only for a single constructor signature per class.
 */

template <typename T> struct ConstructorTraits;

template <typename T>
concept HasConstructorTraits =
    requires { typename ConstructorTraits<T>::arg_types; };

template <typename T, typename Tuple> struct is_constructible_from_tuple;

template <typename T, typename... Args>
struct is_constructible_from_tuple<T, std::tuple<Args...>>
    : std::is_constructible<T, Args...> {};

template <typename T, typename Tuple>
concept ConstructibleFromTuple = is_constructible_from_tuple<T, Tuple>::value;

template <typename NotTuple>
struct last_element_is_call_invoker : std::false_type {};

template <typename... Args>
struct last_element_is_call_invoker<std::tuple<Args...>> {
private:
  template <typename Last> static constexpr bool check() {
    return std::is_same_v<Last, std::shared_ptr<facebook::react::CallInvoker>>;
  }

  template <typename First, typename Second, typename... Rest>
  static constexpr bool check_last() {
    return check_last<Second, Rest...>();
  }

  template <typename Last> static constexpr bool check_last() {
    return check<Last>();
  }

public:
  static constexpr bool value = sizeof...(Args) > 0 && check_last<Args...>();
};

// HasConstructorTraits<T> could be removed as typename
// ConstructorTraits<T>::arg_types would still resolve the concept to false if
// it wouldn't be defined, but we keep it for readability
template <typename T>
concept ValidConstructorTraits =
    HasConstructorTraits<T> &&
    ConstructibleFromTuple<T, typename ConstructorTraits<T>::arg_types>;

template <typename T>
concept CallInvokerLastInConstructor =
    HasConstructorTraits<T> &&
    last_element_is_call_invoker<
        typename ConstructorTraits<T>::arg_types>::value;

template <typename... Types, std::size_t... I>
std::tuple<Types...> fillConstructorTupleFromArgs(
    std::index_sequence<I...>, const jsi::Value *args, jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> jsCallInvoker) {
  constexpr std::size_t lastIndex = sizeof...(Types) - 1;
  return std::make_tuple([&]() {
    if constexpr (I == lastIndex) {
      return jsCallInvoker;
    } else {
      return jsi_conversion::getValue<Types>(args[I], runtime);
    }
  }()...);
}

/// @brief A method that creates a tuple of arguments based on types specified
/// in a ConstructorTraits specialization. The class has to have CallInvoker as
/// the last argument in the constructor.
/// @tparam T The class for which we want to construct the tuple
/// @param args JSI args passed from JS that will be converted according to
/// getValue<T> from JsiConversions
/// @param runtime JS runtime reference
/// @param jsCallInvoker CallInvoker that will be passed to the constructed
/// object. This is the only argument that is not created from jsi::Value.
/// @return A tuple which can then be used to instantiate the class T.
template <typename T>
  requires ValidConstructorTraits<T> && CallInvokerLastInConstructor<T>
auto createConstructorArgsWithCallInvoker(
    const jsi::Value *args, jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> jsCallInvoker) {
  return std::apply(
      [&](auto... typeWrappers) {
        return fillConstructorTupleFromArgs<decltype(typeWrappers)...>(
            std::index_sequence_for<decltype(typeWrappers)...>{}, args, runtime,
            jsCallInvoker);
      },
      typename ConstructorTraits<T>::arg_types{});
}

} // namespace meta

/**
 * @brief A helper macro to create ConstructorTraits for a class. The variadic
 * pack
 * ("...") should list the types of the constructor arguments.
 * @note The Class must be fully declared or forward-declared before this macro
 * is invoked
 */
#define REGISTER_CONSTRUCTOR(Class, ...)                                       \
  template <> struct meta::ConstructorTraits<Class> {                          \
    using arg_types = std::tuple<__VA_ARGS__>;                                 \
  }

} // namespace rnexecutorch