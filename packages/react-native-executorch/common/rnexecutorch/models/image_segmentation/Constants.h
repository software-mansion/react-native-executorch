#pragma once

#include <array>
#include <string_view>

namespace rnexecutorch {
inline constexpr std::array<std::string_view, 21> deeplabv3_resnet50_labels = {
    "BACKGROUND", "AEROPLANE",   "BICYCLE", "BIRD",  "BOAT",
    "BOTTLE",     "BUS",         "CAR",     "CAT",   "CHAIR",
    "COW",        "DININGTABLE", "DOG",     "HORSE", "MOTORBIKE",
    "PERSON",     "POTTEDPLANT", "SHEEP",   "SOFA",  "TRAIN",
    "TVMONITOR"};
} // namespace rnexecutorch