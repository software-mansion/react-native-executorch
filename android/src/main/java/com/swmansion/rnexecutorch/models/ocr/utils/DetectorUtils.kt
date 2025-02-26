package com.swmansion.rnexecutorch.models.ocr.utils

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfFloat4
import org.opencv.core.MatOfInt
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.abs
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

class DetectorUtils {
  companion object {
    private fun normalizeAngle(angle: Double): Double {
      if (angle > 45.0) {
        return angle - 90.0
      }

      return angle
    }

    private fun midpoint(p1: BBoxPoint, p2: BBoxPoint): BBoxPoint {
      val midpoint = BBoxPoint((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
      return midpoint
    }

    private fun distanceBetweenPoints(p1: BBoxPoint, p2: BBoxPoint): Double {
      return sqrt((p1.x - p2.x).pow(2.0) + (p1.y - p2.y).pow(2.0))
    }

    private fun centerOfBox(box: OCRbBox): BBoxPoint {
      val p1 = box.bBox[0]
      val p2 = box.bBox[2]
      return midpoint(p1, p2)
    }

    private fun maxSideLength(box: OCRbBox): Double {
      var maxSideLength = 0.0
      val numOfPoints = box.bBox.size
      for (i in 0 until numOfPoints) {
        val currentPoint = box.bBox[i]
        val nextPoint = box.bBox[(i + 1) % numOfPoints]
        val sideLength = distanceBetweenPoints(currentPoint, nextPoint)
        if (sideLength > maxSideLength) {
          maxSideLength = sideLength
        }
      }
      return maxSideLength
    }

    private fun minSideLength(box: OCRbBox): Double {
      var minSideLength = Double.MAX_VALUE
      val numOfPoints = box.bBox.size
      for (i in 0 until numOfPoints) {
        val currentPoint = box.bBox[i]
        val nextPoint = box.bBox[(i + 1) % numOfPoints]
        val sideLength = distanceBetweenPoints(currentPoint, nextPoint)
        if (sideLength < minSideLength) {
          minSideLength = sideLength
        }
      }
      return minSideLength
    }


    private fun calculateMinimalDistanceBetweenBoxes(box1: OCRbBox, box2: OCRbBox): Double {
      var minDistance = Double.MAX_VALUE
      for (i in 0 until 4) {
        for (j in 0 until 4) {
          val distance = distanceBetweenPoints(box1.bBox[i], box2.bBox[j])
          if (distance < minDistance) {
            minDistance = distance
          }
        }
      }

      return minDistance
    }

    private fun rotateBox(box: OCRbBox, angle: Double): OCRbBox {
      val center = centerOfBox(box)
      val radians = angle * Math.PI / 180
      val newBBox = box.bBox.map { point ->
        val translatedX = point.x - center.x
        val translatedY = point.y - center.y
        val rotatedX = translatedX * cos(radians) - translatedY * sin(radians)
        val rotatedY = translatedX * sin(radians) + translatedY * cos(radians)
        BBoxPoint(rotatedX + center.x, rotatedY + center.y)
      }

      return OCRbBox(newBBox, box.angle)
    }

    private fun orderPointsClockwise(box: OCRbBox): OCRbBox {
      var topLeft = box.bBox[0]
      var topRight = box.bBox[1]
      var bottomRight = box.bBox[2]
      var bottomLeft = box.bBox[3]
      var minSum = Double.MAX_VALUE
      var maxSum = -Double.MAX_VALUE
      var minDiff = Double.MAX_VALUE
      var maxDiff = -Double.MAX_VALUE

      for (point in box.bBox) {
        val sum = point.x + point.y
        val diff = point.x - point.y
        if (sum < minSum) {
          minSum = sum
          topLeft = point
        }
        if (sum > maxSum) {
          maxSum = sum
          bottomRight = point
        }
        if (diff < minDiff) {
          minDiff = diff
          bottomLeft = point
        }
        if (diff > maxDiff) {
          maxDiff = diff
          topRight = point
        }
      }

      return OCRbBox(listOf(topLeft, topRight, bottomRight, bottomLeft), box.angle)
    }

    private fun mergeRotatedBoxes(box1: OCRbBox, box2: OCRbBox): OCRbBox {
      val orderedBox1 = orderPointsClockwise(box1)
      val orderedBox2 = orderPointsClockwise(box2)

      val allPoints = arrayListOf<Point>()
      allPoints.addAll(orderedBox1.bBox.map { Point(it.x, it.y) })
      allPoints.addAll(orderedBox2.bBox.map { Point(it.x, it.y) })

      val matOfAllPoints = MatOfPoint()
      matOfAllPoints.fromList(allPoints)

      val hullIndices = MatOfInt()
      Imgproc.convexHull(matOfAllPoints, hullIndices, false)

      val hullPoints = hullIndices.toArray().map { allPoints[it] }

      val matOfHullPoints = MatOfPoint2f()
      matOfHullPoints.fromList(hullPoints)

      val minAreaRect = Imgproc.minAreaRect(matOfHullPoints)
      val rectPoints = arrayOfNulls<Point>(4)
      minAreaRect.points(rectPoints)

      val bBoxPoints = rectPoints.filterNotNull().map { BBoxPoint(it.x, it.y) }

      return OCRbBox(bBoxPoints, minAreaRect.angle)
    }

    private fun removeSmallBoxes(
      boxes: MutableList<OCRbBox>,
      minSideThreshold: Int,
      maxSideThreshold: Int
    ): MutableList<OCRbBox> {
      return boxes.filter { minSideLength(it) > minSideThreshold && maxSideLength(it) > maxSideThreshold }
        .toMutableList()
    }

    private fun minimumYFromBox(box: List<BBoxPoint>): Double = box.minOf { it.y }

    private fun fitLineToShortestSides(box: OCRbBox): LineInfo {
      val sides = mutableListOf<Pair<Double, Int>>()
      val midpoints = mutableListOf<BBoxPoint>()

      for (i in box.bBox.indices) {
        val p1 = box.bBox[i]
        val p2 = box.bBox[(i + 1) % 4]
        val sideLength = distanceBetweenPoints(p1, p2)
        sides.add(sideLength to i)
        midpoints.add(midpoint(p1, p2))
      }

      sides.sortBy { it.first }

      val midpoint1 = midpoints[sides[0].second]
      val midpoint2 = midpoints[sides[1].second]

      val dx = abs(midpoint2.x - midpoint1.x)
      val line = MatOfFloat4()

      val isVertical = if (dx < 20) {
        for (point in arrayOf(midpoint1, midpoint2)) {
          val temp = point.x
          point.x = point.y
          point.y = temp
        }
        Imgproc.fitLine(
          MatOfPoint2f(
            Point(midpoint1.x, midpoint1.y),
            Point(midpoint2.x, midpoint2.y)
          ), line, Imgproc.DIST_L2, 0.0, 0.01, 0.01
        )
        true
      } else {
        Imgproc.fitLine(
          MatOfPoint2f(
            Point(midpoint1.x, midpoint1.y),
            Point(midpoint2.x, midpoint2.y)
          ), line, Imgproc.DIST_L2, 0.0, 0.01, 0.01
        )
        false
      }

      val m = line.get(1, 0)[0] / line.get(0, 0)[0]  // slope
      val c = line.get(3, 0)[0] - m * line.get(2, 0)[0]  // intercept
      return LineInfo(m, c, isVertical)
    }

    private fun findClosestBox(
      boxes: MutableList<OCRbBox>,
      ignoredIds: Set<Int>,
      currentBox: OCRbBox,
      isVertical: Boolean,
      m: Double,
      c: Double,
      centerThreshold: Double
    ): Pair<Int, Double>? {
      var smallestDistance = Double.MAX_VALUE
      var idx = -1
      var boxHeight = 0.0
      val centerOfCurrentBox = centerOfBox(currentBox)
      boxes.forEachIndexed { i, box ->
        if (ignoredIds.contains(i)) {
          return@forEachIndexed
        }
        val centerOfProcessedBox = centerOfBox(box)
        val distanceBetweenCenters = distanceBetweenPoints(centerOfCurrentBox, centerOfProcessedBox)
        if (distanceBetweenCenters >= smallestDistance) {
          return@forEachIndexed
        }
        boxHeight = minSideLength(box)
        val lineDistance = if (isVertical)
          abs(centerOfProcessedBox.x - (m * centerOfProcessedBox.y + c))
        else
          abs(centerOfProcessedBox.y - (m * centerOfProcessedBox.x + c))

        if (lineDistance < boxHeight * centerThreshold) {
          idx = i
          smallestDistance = distanceBetweenCenters
        }
      }

      return if (idx == -1) null else Pair(idx, boxHeight)
    }

    private fun createMaskFromLabels(labels: Mat, labelValue: Int): Mat {
      val mask = Mat.zeros(labels.size(), CvType.CV_8U)

      Core.compare(labels, Scalar(labelValue.toDouble()), mask, Core.CMP_EQ)

      return mask
    }

    fun interleavedArrayToMats(array: FloatArray, size: Size): Pair<Mat, Mat> {
      val mat1 = Mat(size.height.toInt(), size.width.toInt(), CvType.CV_32F)
      val mat2 = Mat(size.height.toInt(), size.width.toInt(), CvType.CV_32F)

      array.forEachIndexed { index, value ->
        val x = (index / 2) % (size.width.toInt())
        val y = (index / 2) / size.width.toInt()
        if (index % 2 == 0) {
          mat1.put(y, x, value.toDouble())
        } else {
          mat2.put(y, x, value.toDouble())
        }
      }

      return Pair(mat1, mat2)
    }

    fun getDetBoxesFromTextMapVertical(
      textMap: Mat,
      affinityMap: Mat,
      textThreshold: Double,
      linkThreshold: Double,
      independentCharacters: Boolean
    ): MutableList<OCRbBox> {
      val imgH = textMap.rows()
      val imgW = textMap.cols()

      val textScore = Mat()
      val affinityScore = Mat()
      Imgproc.threshold(textMap, textScore, textThreshold, 1.0, Imgproc.THRESH_BINARY)
      Imgproc.threshold(affinityMap, affinityScore, linkThreshold, 1.0, Imgproc.THRESH_BINARY)
      val textScoreComb = Mat()
      val kernel = Imgproc.getStructuringElement(
        Imgproc.MORPH_RECT,
        Size(3.0, 3.0)
      )
      if (independentCharacters) {
        Core.subtract(textScore, affinityScore, textScoreComb)
        Imgproc.threshold(textScoreComb, textScoreComb, 0.0, 0.0, Imgproc.THRESH_TOZERO)
        Imgproc.threshold(textScoreComb, textScoreComb, 1.0, 1.0, Imgproc.THRESH_TRUNC)
        Imgproc.erode(textScoreComb, textScoreComb, kernel, Point(-1.0, -1.0), 1)
        Imgproc.dilate(textScoreComb, textScoreComb, kernel, Point(-1.0, -1.0), 4)
      } else {
        Core.add(textScore, affinityScore, textScoreComb)
        Imgproc.threshold(textScoreComb, textScoreComb, 0.0, 0.0, Imgproc.THRESH_TOZERO)
        Imgproc.threshold(textScoreComb, textScoreComb, 1.0, 1.0, Imgproc.THRESH_TRUNC)
        Imgproc.dilate(textScoreComb, textScoreComb, kernel, Point(-1.0, -1.0), 2)
      }

      val binaryMat = Mat()
      textScoreComb.convertTo(binaryMat, CvType.CV_8UC1)

      val labels = Mat()
      val stats = Mat()
      val centroids = Mat()
      val nLabels = Imgproc.connectedComponentsWithStats(binaryMat, labels, stats, centroids, 4)

      val detectedBoxes = mutableListOf<OCRbBox>()
      for (i in 1 until nLabels) {
        val area = stats.get(i, Imgproc.CC_STAT_AREA)[0].toInt()
        val height = stats.get(i, Imgproc.CC_STAT_HEIGHT)[0].toInt()
        val width = stats.get(i, Imgproc.CC_STAT_WIDTH)[0].toInt()
        if (area < 20) continue

        if (!independentCharacters && height < width) continue
        val mask = createMaskFromLabels(labels, i)

        val segMap = Mat.zeros(textMap.size(), CvType.CV_8U)
        segMap.setTo(Scalar(255.0), mask)

        val x = stats.get(i, Imgproc.CC_STAT_LEFT)[0].toInt()
        val y = stats.get(i, Imgproc.CC_STAT_TOP)[0].toInt()
        val w = stats.get(i, Imgproc.CC_STAT_WIDTH)[0].toInt()
        val h = stats.get(i, Imgproc.CC_STAT_HEIGHT)[0].toInt()
        val dilationRadius = (sqrt(area / max(w, h).toDouble()) * 2.0).toInt()
        val sx = max(x - dilationRadius, 0)
        val ex = min(x + w + dilationRadius + 1, imgW)
        val sy = max(y - dilationRadius, 0)
        val ey = min(y + h + dilationRadius + 1, imgH)
        val roi = Rect(sx, sy, ex - sx, ey - sy)
        val kernel = Imgproc.getStructuringElement(
          Imgproc.MORPH_RECT,
          Size((1 + dilationRadius).toDouble(), (1 + dilationRadius).toDouble())
        )
        val roiSegMap = Mat(segMap, roi)
        Imgproc.dilate(roiSegMap, roiSegMap, kernel, Point(-1.0, -1.0), 2)

        val contours: List<MatOfPoint> = ArrayList()
        Imgproc.findContours(
          segMap,
          contours,
          Mat(),
          Imgproc.RETR_EXTERNAL,
          Imgproc.CHAIN_APPROX_SIMPLE
        )
        if (contours.isNotEmpty()) {
          val minRect = Imgproc.minAreaRect(MatOfPoint2f(*contours[0].toArray()))
          val points = Array(4) { Point() }
          minRect.points(points)
          val pointsList = points.map { point -> BBoxPoint(point.x, point.y) }
          val boxInfo = OCRbBox(pointsList, minRect.angle)
          detectedBoxes.add(boxInfo)
        }
      }

      return detectedBoxes
    }

    fun getDetBoxesFromTextMap(
      textMap: Mat,
      affinityMap: Mat,
      textThreshold: Double,
      linkThreshold: Double,
      lowTextThreshold: Double
    ): MutableList<OCRbBox> {
      val imgH = textMap.rows()
      val imgW = textMap.cols()

      val textScore = Mat()
      val affinityScore = Mat()
      Imgproc.threshold(textMap, textScore, textThreshold, 1.0, Imgproc.THRESH_BINARY)
      Imgproc.threshold(affinityMap, affinityScore, linkThreshold, 1.0, Imgproc.THRESH_BINARY)
      val textScoreComb = Mat()
      Core.add(textScore, affinityScore, textScoreComb)
      Imgproc.threshold(textScoreComb, textScoreComb, 0.0, 1.0, Imgproc.THRESH_BINARY)

      val binaryMat = Mat()
      textScoreComb.convertTo(binaryMat, CvType.CV_8UC1)

      val labels = Mat()
      val stats = Mat()
      val centroids = Mat()
      val nLabels = Imgproc.connectedComponentsWithStats(binaryMat, labels, stats, centroids, 4)

      val detectedBoxes = mutableListOf<OCRbBox>()
      for (i in 1 until nLabels) {
        val area = stats.get(i, Imgproc.CC_STAT_AREA)[0].toInt()
        if (area < 10) continue
        val mask = createMaskFromLabels(labels, i)
        val maxValResult = Core.minMaxLoc(textMap, mask)
        val maxVal = maxValResult.maxVal
        if (maxVal < lowTextThreshold) continue
        val segMap = Mat.zeros(textMap.size(), CvType.CV_8U)
        segMap.setTo(Scalar(255.0), mask)

        val x = stats.get(i, Imgproc.CC_STAT_LEFT)[0].toInt()
        val y = stats.get(i, Imgproc.CC_STAT_TOP)[0].toInt()
        val w = stats.get(i, Imgproc.CC_STAT_WIDTH)[0].toInt()
        val h = stats.get(i, Imgproc.CC_STAT_HEIGHT)[0].toInt()
        val dilationRadius = (sqrt(area / max(w, h).toDouble()) * 2.0).toInt()
        val sx = max(x - dilationRadius, 0)
        val ex = min(x + w + dilationRadius + 1, imgW)
        val sy = max(y - dilationRadius, 0)
        val ey = min(y + h + dilationRadius + 1, imgH)
        val roi = Rect(sx, sy, ex - sx, ey - sy)
        val kernel = Imgproc.getStructuringElement(
          Imgproc.MORPH_RECT,
          Size((1 + dilationRadius).toDouble(), (1 + dilationRadius).toDouble())
        )
        val roiSegMap = Mat(segMap, roi)
        Imgproc.dilate(roiSegMap, roiSegMap, kernel)

        val contours: List<MatOfPoint> = ArrayList()
        Imgproc.findContours(
          segMap,
          contours,
          Mat(),
          Imgproc.RETR_EXTERNAL,
          Imgproc.CHAIN_APPROX_SIMPLE
        )
        if (contours.isNotEmpty()) {
          val minRect = Imgproc.minAreaRect(MatOfPoint2f(*contours[0].toArray()))
          val points = Array(4) { Point() }
          minRect.points(points)
          val pointsList = points.map { point -> BBoxPoint(point.x, point.y) }
          val boxInfo = OCRbBox(pointsList, minRect.angle)
          detectedBoxes.add(boxInfo)
        }
      }

      return detectedBoxes
    }

    fun restoreBoxRatio(boxes: MutableList<OCRbBox>, restoreRatio: Float): MutableList<OCRbBox> {
      for (box in boxes) {
        for (b in box.bBox) {
          b.x *= restoreRatio
          b.y *= restoreRatio
        }
      }

      return boxes
    }

    fun groupTextBoxes(
      boxes: MutableList<OCRbBox>,
      centerThreshold: Double,
      distanceThreshold: Double,
      heightThreshold: Double,
      minSideThreshold: Int,
      maxSideThreshold: Int,
      maxWidth: Int
    ): MutableList<OCRbBox> {
      boxes.sortByDescending { maxSideLength(it) }
      var mergedArray = mutableListOf<OCRbBox>()

      while (boxes.isNotEmpty()) {
        var currentBox = boxes.removeAt(0)
        val normalizedAngle = normalizeAngle(currentBox.angle)
        val ignoredIds = mutableSetOf<Int>()
        var lineAngle: Double
        while (true) {
          val fittedLine =
            fitLineToShortestSides(currentBox)
          val slope = fittedLine.slope
          val intercept = fittedLine.intercept
          val isVertical = fittedLine.isVertical

          lineAngle = atan(slope) * 180 / Math.PI
          if (isVertical) {
            lineAngle = -90.0
          }

          val closestBoxInfo = findClosestBox(
            boxes, ignoredIds, currentBox,
            isVertical, slope, intercept, centerThreshold
          ) ?: break

          val candidateIdx = closestBoxInfo.first
          var candidateBox = boxes[candidateIdx]
          val candidateHeight = closestBoxInfo.second
          if ((candidateBox.angle == 90.0 && !isVertical) || (candidateBox.angle == 0.0 && isVertical)) {
            candidateBox =
              rotateBox(candidateBox, normalizedAngle)
          }
          val minDistance =
            calculateMinimalDistanceBetweenBoxes(candidateBox, currentBox)
          val mergedHeight = minSideLength(currentBox)
          if (minDistance < distanceThreshold * candidateHeight && abs(mergedHeight - candidateHeight) < candidateHeight * heightThreshold) {
            currentBox = mergeRotatedBoxes(currentBox, candidateBox)
            boxes.removeAt(candidateIdx)
            ignoredIds.clear()
            if (maxSideLength(currentBox) > maxWidth) {
              break
            }
          } else {
            ignoredIds.add(candidateIdx)
          }
        }
        mergedArray.add(currentBox.copy(angle = lineAngle))
      }

      mergedArray = removeSmallBoxes(mergedArray, minSideThreshold, maxSideThreshold)
      mergedArray = mergedArray.sortedWith(compareBy { minimumYFromBox(it.bBox) }).toMutableList()

      mergedArray = mergedArray.map { box -> orderPointsClockwise(box) }.toMutableList()

      return mergedArray
    }
  }
}

data class BBoxPoint(
  var x: Double,
  var y: Double,
)

data class OCRbBox(
  val bBox: List<BBoxPoint>,
  val angle: Double,
) {
  fun toWritableArray(): WritableArray {
    val array = Arguments.createArray()
    bBox.forEach { point ->
      val pointMap = Arguments.createMap()
      pointMap.putDouble("x", point.x)
      pointMap.putDouble("y", point.y)
      array.pushMap(pointMap)
    }
    return array
  }
}

data class LineInfo(
  val slope: Double,
  val intercept: Double,
  val isVertical: Boolean
)
