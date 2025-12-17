#pragma once

#include "types.h"
#include <concepts>
#include <cstdint>
#include <exception>
#include <iostream>
#include <string>
#include <type_traits>
#include <unordered_map>

namespace phonemis::preprocessor::num2words {

// Specialized conversions
// In order to cover different numeric types, we use capable
// 64-bit long long and double types in conversions.
std::string to_cardinal_int(long long value);
std::string to_cardinal_float(double value);
std::string to_ordinal(long long value);
std::string to_year(long long value);

// Generic conversion - from number
// Converts from numerical to spoken text representation.
// Example: 15 -> fifteen.
template <typename T, ConversionMode mode = ConversionMode::CARDINAL>
  requires std::is_arithmetic_v<T>
std::string convert(T value) {
  constexpr bool is_float = std::is_floating_point_v<T>;

  if constexpr (mode == ConversionMode::CARDINAL)
    return is_float ? to_cardinal_float(static_cast<double>(value))
                    : to_cardinal_int(static_cast<long long>(value));
  if constexpr (mode == ConversionMode::ORDINAL)
    return to_ordinal(static_cast<long long>(value));
  if constexpr (mode == ConversionMode::YEAR)
    return to_year(static_cast<long long>(value));

  // Fallback - conversion to non-spoken text representation
  return std::to_string(value);
}

// Generic conversion - from a text
// Similar to the one above, but takes non-spoken text representation
// of a number instead.
template <ConversionMode mode = ConversionMode::CARDINAL>
std::string convert(std::string numText) {
  bool is_float = numText.find('.') != std::string::npos;

  if (is_float) {
    double float_value = std::stod(numText);
    return convert<double, mode>(float_value);
  } else {
    long long int_value = std::stoll(numText);
    return convert<long long, mode>(int_value);
  }
}

} // namespace phonemis::preprocessor::num2words