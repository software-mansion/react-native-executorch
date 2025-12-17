#pragma once

#include <algorithm>
#include <codecvt>
#include <functional>
#include <optional>
#include <string>
#include <string_view>
#include <vector>

namespace phonemis::utilities::string_utils {

// -------------------------------------
// String utils - byte format conversion
// -------------------------------------

// TODO: deprecated, replace with something else

inline std::string char32_to_utf8(char32_t c) {
  std::wstring_convert<std::codecvt_utf8<char32_t>, char32_t> convert;
  return convert.to_bytes(&c, &c + 1);
}

inline std::u32string utf8_to_u32string(const std::string &utf8) {
  std::wstring_convert<std::codecvt_utf8<char32_t>, char32_t> convert;
  return convert.from_bytes(utf8);
}

inline std::string u32string_to_utf8(const std::u32string &u32) {
  std::wstring_convert<std::codecvt_utf8<char32_t>, char32_t> convert;
  return convert.to_bytes(u32);
}

// ----------------------------------------
// String utils - capitalizing & lowerizing
// ----------------------------------------

// Capitalization (first letter only)
template <typename StringT> inline void capitalize__(StringT &str) {
  if (!str.empty())
    str[0] = std::toupper(str[0]);
}

// Capitalization (an entire string)
template <typename StringT> inline void to_upper__(StringT &str) {
  std::transform(str.cbegin(), str.cend(), str.begin(),
                 [](auto c) { return std::toupper(c); });
}

// Lowerization (an entire string)
template <typename StringT> inline void to_lower__(StringT &str) {
  std::transform(str.cbegin(), str.cend(), str.begin(),
                 [](auto c) { return std::tolower(c); });
}

// ------------------------------------
// String utils - other transformations
// ------------------------------------

// Filters a given string and omits all the characters which
// do not pass given predicate.
template <typename StringT, typename Pred>
inline void filter__(StringT &str, Pred pred) {
  str.erase(std::remove_if(str.begin(), str.end(), pred), str.end());
}

// Replaces all the occurances of a character `a` with a character `b`.
// If `b` is not specified, then it removes all occurances of `a` without
// replacement.
template <typename StringT, typename CharT>
inline void replace__(StringT &str, CharT a, std::optional<CharT> b) {
  if (b.has_value())
    std::replace(str.begin(), str.end(), a, b.value());
  else
    str.erase(std::remove(str.begin(), str.end(), a), str.end());
}

// Splits the string by the given character.
template <typename StringT, typename CharT>
inline std::vector<StringT> split(const StringT &str, CharT bpoint) {
  std::vector<StringT> result = {};

  auto it = str.begin();
  while (it != str.end()) {
    auto next = std::find(it, str.end(), bpoint);
    result.emplace_back(it, next);

    it = next;
    if (it != str.end())
      it++;
  }

  return result;
}

// Removes the leading and trailing characters equals to given character.
// If the character is not specified, it removes white spaces instead.
template <typename StringT, typename CharT>
inline StringT strip(const StringT &str,
                     std::optional<CharT> c = std::nullopt) {
  auto lbound = std::find_if(str.cbegin(), str.cend(), [&c](CharT a) -> bool {
    return c.has_value() ? a != c : !std::isspace(a);
  });
  auto rbound = std::find_if(str.crbegin(), str.crend(), [&c](CharT a) -> bool {
    return c.has_value() ? a != c : !std::isspace(a);
  });

  return lbound != str.end() ? StringT(lbound, std::prev(rbound.base()))
                             : StringT();
}

// -------------------------
// String utils - predicates
// -------------------------

// Returns true if the string contains only alphabetic characters.
template <typename StringT> inline bool is_alpha(const StringT &str) {
  return std::all_of(str.cbegin(), str.cend(),
                     [](char c) -> bool { return std::isalpha(c); });
}

// Returns true if the string starts with given suffix and false otherwise
template <typename StringT>
inline bool starts_with(const StringT &str, std::string_view prefix) {
  return str.size() >= prefix.size() && str.substr(0, prefix.size()) == prefix;
}

// Returns true if the string ends with given suffix and false otherwise
template <typename StringT>
inline bool ends_with(const StringT &str, std::string_view suffix) {
  return str.size() >= suffix.size() &&
         str.substr(str.size() - suffix.size()) == suffix;
}

// --------------------------------------
// String utils - (non)in-place resolving
// --------------------------------------

// Generates non-mutating wrapper `name(...)` that calls `name__(...)`
// Used to create a non-inplace versions of the above functions.
#define MAKE_NON_INPLACE(name)                                                 \
  template <typename StringT, typename... Args>                                \
  inline StringT name(const StringT &str, Args &&...args) {                    \
    StringT tmp = str;                                                         \
    name##__(tmp, std::forward<Args>(args)...);                                \
    return tmp;                                                                \
  }

MAKE_NON_INPLACE(capitalize)
MAKE_NON_INPLACE(to_lower)
MAKE_NON_INPLACE(to_upper)
MAKE_NON_INPLACE(filter)
MAKE_NON_INPLACE(replace)

} // namespace phonemis::utilities::string_utils