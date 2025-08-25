#pragma once

#include <array>
#include <string_view>

namespace rnexecutorch::models::image_segmentation::constants {
inline constexpr std::array<std::string_view, 21> kDeeplabV3Resnet50Labels = {
    "BACKGROUND", "AEROPLANE",   "BICYCLE", "BIRD",  "BOAT",
    "BOTTLE",     "BUS",         "CAR",     "CAT",   "CHAIR",
    "COW",        "DININGTABLE", "DOG",     "HORSE", "MOTORBIKE",
    "PERSON",     "POTTEDPLANT", "SHEEP",   "SOFA",  "TRAIN",
    "TVMONITOR"};
} // namespace rnexecutorch::models::image_segmentation::constants