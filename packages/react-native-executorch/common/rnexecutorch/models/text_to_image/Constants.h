#pragma once

#include <array>
#include <string>

namespace rnexecutorch::models::text_to_image::constants {

inline constexpr std::string kBosToken = "<|startoftext|>";

} // namespace rnexecutorch::models::text_to_image::constants

// export this "<|startoftext|>" as kBosToken