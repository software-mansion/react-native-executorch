#pragma once

#include <type_traits>

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {

template <typename T>
concept DerivedFromBaseModel = std::is_base_of_v<BaseModel, T>;

} // namespace rnexecutorch