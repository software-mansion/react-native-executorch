#pragma once

#include <string>
#include <unordered_map>

namespace rnexecutorch::models::object_detection::constants {
inline constexpr float IOU_THRESHOLD = 0.55;

inline const std::unordered_map<int, std::string> kCocoLablesMap = {
    {1, "PERSON"},         {2, "BICYCLE"},       {3, "CAR"},
    {4, "MOTORCYCLE"},     {5, "AIRPLANE"},      {6, "BUS"},
    {7, "TRAIN"},          {8, "TRUCK"},         {9, "BOAT"},
    {10, "TRAFFIC_LIGHT"}, {11, "FIRE_HYDRANT"}, {12, "STREET_SIGN"},
    {13, "STOP_SIGN"},     {14, "PARKING"},      {15, "BENCH"},
    {16, "BIRD"},          {17, "CAT"},          {18, "DOG"},
    {19, "HORSE"},         {20, "SHEEP"},        {21, "COW"},
    {22, "ELEPHANT"},      {23, "BEAR"},         {24, "ZEBRA"},
    {25, "GIRAFFE"},       {26, "HAT"},          {27, "BACKPACK"},
    {28, "UMBRELLA"},      {29, "SHOE"},         {30, "EYE"},
    {31, "HANDBAG"},       {32, "TIE"},          {33, "SUITCASE"},
    {34, "FRISBEE"},       {35, "SKIS"},         {36, "SNOWBOARD"},
    {37, "SPORTS"},        {38, "KITE"},         {39, "BASEBALL"},
    {40, "BASEBALL"},      {41, "SKATEBOARD"},   {42, "SURFBOARD"},
    {43, "TENNIS_RACKET"}, {44, "BOTTLE"},       {45, "PLATE"},
    {46, "WINE_GLASS"},    {47, "CUP"},          {48, "FORK"},
    {49, "KNIFE"},         {50, "SPOON"},        {51, "BOWL"},
    {52, "BANANA"},        {53, "APPLE"},        {54, "SANDWICH"},
    {55, "ORANGE"},        {56, "BROCCOLI"},     {57, "CARROT"},
    {58, "HOT_DOG"},       {59, "PIZZA"},        {60, "DONUT"},
    {61, "CAKE"},          {62, "CHAIR"},        {63, "COUCH"},
    {64, "POTTED_PLANT"},  {65, "BED"},          {66, "MIRROR"},
    {67, "DINING_TABLE"},  {68, "WINDOW"},       {69, "DESK"},
    {70, "TOILET"},        {71, "DOOR"},         {72, "TV"},
    {73, "LAPTOP"},        {74, "MOUSE"},        {75, "REMOTE"},
    {76, "KEYBOARD"},      {77, "CELL_PHONE"},   {78, "MICROWAVE"},
    {79, "OVEN"},          {80, "TOASTER"},      {81, "SINK"},
    {82, "REFRIGERATOR"},  {83, "BLENDER"},      {84, "BOOK"},
    {85, "CLOCK"},         {86, "VASE"},         {87, "SCISSORS"},
    {88, "TEDDY_BEAR"},    {89, "HAIR_DRIER"},   {90, "TOOTHBRUSH"},
    {91, "HAIR_BRUSH"}};
} // namespace rnexecutorch::models::object_detection::constants