package com.swmansion.rnexecutorch.utils

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

fun nms(
  detections: MutableList<Detection>,
  iouThreshold: Float
): List<Detection> {
  if (detections.isEmpty()) {
    return emptyList()
  }

  // Sort detections first by label, then by score (descending)
  val sortedDetections = detections.sortedWith(compareBy({ it.label }, { -it.score }))

  val result = mutableListOf<Detection>()

  // Process NMS for each label group
  var i = 0
  while (i < sortedDetections.size) {
    val currentLabel = sortedDetections[i].label

    // Collect detections for the current label
    val labelDetections = mutableListOf<Detection>()
    while (i < sortedDetections.size && sortedDetections[i].label == currentLabel) {
      labelDetections.add(sortedDetections[i])
      i++
    }

    // Filter out detections with high IoU
    val filteredLabelDetections = mutableListOf<Detection>()
    while (labelDetections.isNotEmpty()) {
      val current = labelDetections.removeAt(0)
      filteredLabelDetections.add(current)

      // Remove detections that overlap with the current detection above the IoU threshold
      val iterator = labelDetections.iterator()
      while (iterator.hasNext()) {
        val other = iterator.next()
        if (calculateIoU(current.bbox, other.bbox) > iouThreshold) {
          iterator.remove()  // Remove detection if IoU is above threshold
        }
      }
    }

    // Add the filtered detections to the result
    result.addAll(filteredLabelDetections)
  }

  return result
}

fun calculateIoU(bbox1: Bbox, bbox2: Bbox): Float {
  val x1 = maxOf(bbox1.x1, bbox2.x1)
  val y1 = maxOf(bbox1.y1, bbox2.y1)
  val x2 = minOf(bbox1.x2, bbox2.x2)
  val y2 = minOf(bbox1.y2, bbox2.y2)

  val intersectionArea = maxOf(0f, x2 - x1) * maxOf(0f, y2 - y1)
  val bbox1Area = (bbox1.x2 - bbox1.x1) * (bbox1.y2 - bbox1.y1)
  val bbox2Area = (bbox2.x2 - bbox2.x1) * (bbox2.y2 - bbox2.y1)

  val unionArea = bbox1Area + bbox2Area - intersectionArea
  return if (unionArea == 0f) 0f else intersectionArea / unionArea
}


data class Bbox(
  val x1: Float,
  val y1: Float,
  val x2: Float,
  val y2: Float
) {
  fun toWritableMap(): WritableMap {
    val map = Arguments.createMap()
    map.putDouble("x1", x1.toDouble())
    map.putDouble("x2", x2.toDouble())
    map.putDouble("y1", y1.toDouble())
    map.putDouble("y2", y2.toDouble())
    return map
  }
}


data class Detection(
  val bbox: Bbox,
  val score: Float,
  val label: CocoLabel,
) {
  fun toWritableMap(): WritableMap {
    val map = Arguments.createMap()
    map.putMap("bbox", bbox.toWritableMap())
    map.putDouble("score", score.toDouble())
    map.putString("label", label.name)
    return map
  }
}

enum class CocoLabel(val id: Int) {
  PERSON(1),
  BICYCLE(2),
  CAR(3),
  MOTORCYCLE(4),
  AIRPLANE(5),
  BUS(6),
  TRAIN(7),
  TRUCK(8),
  BOAT(9),
  TRAFFIC_LIGHT(10),
  FIRE_HYDRANT(11),
  STREET_SIGN(12),
  STOP_SIGN(13),
  PARKING(14),
  BENCH(15),
  BIRD(16),
  CAT(17),
  DOG(18),
  HORSE(19),
  SHEEP(20),
  COW(21),
  ELEPHANT(22),
  BEAR(23),
  ZEBRA(24),
  GIRAFFE(25),
  HAT(26),
  BACKPACK(27),
  UMBRELLA(28),
  SHOE(29),
  EYE(30),
  HANDBAG(31),
  TIE(32),
  SUITCASE(33),
  FRISBEE(34),
  SKIS(35),
  SNOWBOARD(36),
  SPORTS(37),
  KITE(38),
  BASEBALL(39),
  SKATEBOARD(41),
  SURFBOARD(42),
  TENNIS_RACKET(43),
  BOTTLE(44),
  PLATE(45),
  WINE_GLASS(46),
  CUP(47),
  FORK(48),
  KNIFE(49),
  SPOON(50),
  BOWL(51),
  BANANA(52),
  APPLE(53),
  SANDWICH(54),
  ORANGE(55),
  BROCCOLI(56),
  CARROT(57),
  HOT_DOG(58),
  PIZZA(59),
  DONUT(60),
  CAKE(61),
  CHAIR(62),
  COUCH(63),
  POTTED_PLANT(64),
  BED(65),
  MIRROR(66),
  DINING_TABLE(67),
  WINDOW(68),
  DESK(69),
  TOILET(70),
  DOOR(71),
  TV(72),
  LAPTOP(73),
  MOUSE(74),
  REMOTE(75),
  KEYBOARD(76),
  CELL_PHONE(77),
  MICROWAVE(78),
  OVEN(79),
  TOASTER(80),
  SINK(81),
  REFRIGERATOR(82),
  BLENDER(83),
  BOOK(84),
  CLOCK(85),
  VASE(86),
  SCISSORS(87),
  TEDDY_BEAR(88),
  HAIR_DRIER(89),
  TOOTHBRUSH(90),
  HAIR_BRUSH(91);

  companion object {
    private val idToLabelMap = values().associateBy(CocoLabel::id)
    fun fromId(id: Int): CocoLabel? = idToLabelMap[id]
  }
}
