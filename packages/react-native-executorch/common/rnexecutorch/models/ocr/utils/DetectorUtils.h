#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/Types.h>
#include <span>

namespace rnexecutorch::models::ocr::utils {
std::pair<cv::Mat, cv::Mat> interleavedArrayToMats(std::span<const float> data,
                                                   cv::Size size);
/**
 * This method applies a series of image processing operations to identify
 * likely areas of text in the textMap and return the bounding boxes for single
 * words.
 *
 * @param textMap A cv::Mat representing a heat map of the characters of text
 * being present in an image.
 * @param affinityMap A cv::Mat representing a heat map of the affinity between
 * characters.
 * @param textThreshold A float representing the threshold for the text map.
 * @param linkThreshold A float representing the threshold for the affinity
 * map.
 * @param lowTextThreshold A float representing the low text.
 *
 * @return A vector containing DetectorBBox bounding boxes. Each DetectorBBox
 * includes:
 *  - "bbox": an array of Point values representing the vertices of the
 * detected text box.
 *  - "angle": a float representing the rotation angle of the box.
 */
std::vector<types::DetectorBBox> getDetBoxesFromTextMap(cv::Mat &textMap,
                                                        cv::Mat &affinityMap,
                                                        float textThreshold,
                                                        float linkThreshold,
                                                        float lowTextThreshold);
std::vector<types::DetectorBBox>
getDetBoxesFromTextMapVertical(cv::Mat &textMap, cv::Mat &affinityMap,
                               float textThreshold, float linkThreshold,
                               bool independentCharacters);

float calculateRestoreRatio(int32_t currentSize, int32_t desiredSize);

void restoreBboxRatio(std::vector<types::DetectorBBox> &boxes,
                      float restoreRatio);
/**
 * This method processes a vector of DetectorBBox bounding boxes, each
 * containing details about individual text boxes, and attempts to group and
 * merge these boxes based on specified criteria including proximity, alignment,
 * and size thresholds. It prioritizes merging of boxes that are aligned closely
 * in angle, are near each other, and whose sizes are compatible based on the
 * given thresholds.
 *
 * @param boxes A vector of DetectorBBoxes where each bounding box
 * represents a text box.
 * @param centerThreshold A float representing the threshold for considering
 * the distance between center and fitted line.
 * @param distanceThreshold A float that defines the maximum allowed distance
 * between boxes for them to be considered for merging.
 * @param heightThreshold A float representing the maximum allowed difference
 * in height between boxes for merging.
 * @param minSideThreshold An int that defines the minimum dimension threshold
 * to filter out small boxes after grouping.
 * @param maxSideThreshold An int that specifies the maximum dimension threshold
 * for filtering boxes post-grouping.
 * @param maxWidth An int that represents the maximum width allowable for a
 * merged box.
 *
 * @return A vector of DetectorBBoxes representing the merged boxes.
 *
 * Processing Steps:
 * 1. Sort initial boxes based on their maximum side length.
 * 2. Sequentially merge boxes considering alignment, proximity, and size
 * compatibility.
 * 3. Post-processing to remove any boxes that are too small.
 * 4. Sort the final array of boxes by their vertical positions.
 */
std::vector<types::DetectorBBox>
groupTextBoxes(std::vector<types::DetectorBBox> &boxes, float centerThreshold,
               float distanceThreshold, float heightThreshold,
               int32_t minSideThreshold, int32_t maxSideThreshold,
               int32_t maxWidth);
} // namespace rnexecutorch::models::ocr::utils
