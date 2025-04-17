package com.swmansion.rnexecutorch.models.ocr.utils

import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfFloat
import org.opencv.core.MatOfInt
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sqrt

class RecognizerUtils {
  companion object {
    private fun calculateRatio(
      width: Int,
      height: Int,
    ): Double {
      var ratio = width.toDouble() / height.toDouble()
      if (ratio < 1.0) {
        ratio = 1.0 / ratio
      }

      return ratio
    }

    private fun findIntersection(
      r1: Rect,
      r2: Rect,
    ): Rect {
      val aLeft = r1.x
      val aTop = r1.y
      val aRight = r1.x + r1.width
      val aBottom = r1.y + r1.height

      val bLeft = r2.x
      val bTop = r2.y
      val bRight = r2.x + r2.width
      val bBottom = r2.y + r2.height

      val iLeft = max(aLeft, bLeft)
      val iTop = max(aTop, bTop)
      val iRight = min(aRight, bRight)
      val iBottom = min(aBottom, bBottom)

      return if (iRight > iLeft && iBottom > iTop) {
        Rect(iLeft, iTop, iRight - iLeft, iBottom - iTop)
      } else {
        Rect()
      }
    }

    private fun adjustContrastGrey(
      img: Mat,
      target: Double,
    ): Mat {
      var high = 0
      var low = 255

      for (i in 0 until img.rows()) {
        for (j in 0 until img.cols()) {
          val pixel = img.get(i, j)[0].toInt()
          high = maxOf(high, pixel)
          low = minOf(low, pixel)
        }
      }

      val contrast = (high - low) / 255.0

      if (contrast < target) {
        val ratio = 200.0 / maxOf(10, high - low)
        val tempImg = Mat()
        img.convertTo(tempImg, CvType.CV_32F)
        Core.subtract(tempImg, Scalar(low.toDouble() - 25), tempImg)
        Core.multiply(tempImg, Scalar(ratio), tempImg)
        Imgproc.threshold(tempImg, tempImg, 255.0, 255.0, Imgproc.THRESH_TRUNC)
        Imgproc.threshold(tempImg, tempImg, 0.0, 255.0, Imgproc.THRESH_TOZERO)
        tempImg.convertTo(tempImg, CvType.CV_8U)

        return tempImg
      }

      return img
    }

    private fun computeRatioAndResize(
      img: Mat,
      width: Int,
      height: Int,
      modelHeight: Int,
    ): Mat {
      var ratio = width.toDouble() / height.toDouble()

      if (ratio < 1.0) {
        ratio =
          calculateRatio(width, height)
        Imgproc.resize(
          img,
          img,
          Size(modelHeight.toDouble(), (modelHeight * ratio)),
          0.0,
          0.0,
          Imgproc.INTER_LANCZOS4,
        )
      } else {
        Imgproc.resize(
          img,
          img,
          Size((modelHeight * ratio), modelHeight.toDouble()),
          0.0,
          0.0,
          Imgproc.INTER_LANCZOS4,
        )
      }

      return img
    }

    fun softmax(inputs: Mat): Mat {
      val maxVal = Mat()
      Core.reduce(inputs, maxVal, 1, Core.REDUCE_MAX, CvType.CV_32F)

      val tiledMaxVal = Mat()
      Core.repeat(maxVal, 1, inputs.width(), tiledMaxVal)
      val expInputs = Mat()
      Core.subtract(inputs, tiledMaxVal, expInputs)
      Core.exp(expInputs, expInputs)

      val sumExp = Mat()
      Core.reduce(expInputs, sumExp, 1, Core.REDUCE_SUM, CvType.CV_32F)

      val tiledSumExp = Mat()
      Core.repeat(sumExp, 1, inputs.width(), tiledSumExp)
      val softmaxOutput = Mat()
      Core.divide(expInputs, tiledSumExp, softmaxOutput)

      return softmaxOutput
    }

    fun sumProbabilityRows(
      probabilities: Mat,
      modelOutputHeight: Int,
    ): FloatArray {
      val predsNorm = FloatArray(probabilities.rows())

      for (i in 0 until probabilities.rows()) {
        var sum = 0.0
        for (j in 0 until modelOutputHeight) {
          sum += probabilities.get(i, j)[0]
        }
        predsNorm[i] = sum.toFloat()
      }

      return predsNorm
    }

    fun divideMatrixByVector(
      matrix: Mat,
      vector: FloatArray,
    ): Mat {
      for (i in 0 until matrix.rows()) {
        for (j in 0 until matrix.cols()) {
          val value = matrix.get(i, j)[0] / vector[i]
          matrix.put(i, j, value)
        }
      }

      return matrix
    }

    fun findMaxValuesAndIndices(probabilities: Mat): Pair<DoubleArray, List<Int>> {
      val values = DoubleArray(probabilities.rows())
      val indices = mutableListOf<Int>()

      for (i in 0 until probabilities.rows()) {
        val row = probabilities.row(i)
        val minMaxLocResult = Core.minMaxLoc(row)

        values[i] = minMaxLocResult.maxVal
        indices.add(minMaxLocResult.maxLoc.x.toInt())
      }

      return Pair(values, indices)
    }

    fun computeConfidenceScore(
      valuesArray: DoubleArray,
      indicesArray: List<Int>,
    ): Double {
      val predsMaxProb = mutableListOf<Double>()
      for ((index, value) in indicesArray.withIndex()) {
        if (value != 0) predsMaxProb.add(valuesArray[index])
      }

      val nonZeroValues =
        if (predsMaxProb.isEmpty()) doubleArrayOf(0.0) else predsMaxProb.toDoubleArray()
      val product = nonZeroValues.reduce { acc, d -> acc * d }
      val score = product.pow(2.0 / sqrt(nonZeroValues.size.toDouble()))

      return score
    }

    fun calculateResizeRatioAndPaddings(
      width: Int,
      height: Int,
      desiredWidth: Int,
      desiredHeight: Int,
    ): Map<String, Any> {
      val newRatioH = desiredHeight.toFloat() / height
      val newRatioW = desiredWidth.toFloat() / width
      var resizeRatio = minOf(newRatioH, newRatioW)

      val newWidth = (width * resizeRatio).toInt()
      val newHeight = (height * resizeRatio).toInt()

      val deltaW = desiredWidth - newWidth
      val deltaH = desiredHeight - newHeight

      val top = deltaH / 2
      val left = deltaW / 2

      val heightRatio = height.toFloat() / desiredHeight
      val widthRatio = width.toFloat() / desiredWidth

      resizeRatio = maxOf(heightRatio, widthRatio)

      return mapOf(
        "resizeRatio" to resizeRatio,
        "top" to top,
        "left" to left,
      )
    }

    fun getCroppedImage(
      box: OCRbBox,
      image: Mat,
      modelHeight: Int,
    ): Mat {
      val cords = box.bBox
      val angle = box.angle
      val points = ArrayList<Point>()

      cords.forEach { point ->
        points.add(Point(point.x, point.y))
      }

      val rotatedRect = Imgproc.minAreaRect(MatOfPoint2f(*points.toTypedArray()))
      val imageCenter = Point((image.cols() / 2.0), (image.rows() / 2.0))
      val rotationMatrix = Imgproc.getRotationMatrix2D(imageCenter, angle, 1.0)
      val rotatedImage = Mat()
      Imgproc.warpAffine(image, rotatedImage, rotationMatrix, image.size(), Imgproc.INTER_LINEAR)

      val rectPoints = Array(4) { Point() }
      rotatedRect.points(rectPoints)
      val transformedPoints = arrayOfNulls<Point>(4)
      val rectMat = Mat(4, 2, CvType.CV_32FC2)
      for (i in 0 until 4) {
        rectMat.put(i, 0, *doubleArrayOf(rectPoints[i].x, rectPoints[i].y))
      }
      Core.transform(rectMat, rectMat, rotationMatrix)

      for (i in 0 until 4) {
        transformedPoints[i] = Point(rectMat.get(i, 0)[0], rectMat.get(i, 0)[1])
      }

      var boundingBox =
        Imgproc.boundingRect(MatOfPoint2f(*transformedPoints.filterNotNull().toTypedArray()))
      val validRegion = Rect(0, 0, rotatedImage.cols(), rotatedImage.rows())
      boundingBox = findIntersection(boundingBox, validRegion)
      val croppedImage = Mat(rotatedImage, boundingBox)
      if (croppedImage.empty()) {
        return croppedImage
      }

      return computeRatioAndResize(croppedImage, boundingBox.width, boundingBox.height, modelHeight)
    }

    fun normalizeForRecognizer(
      image: Mat,
      adjustContrast: Double,
      isVertical: Boolean = false,
    ): Mat {
      var img = image.clone()

      if (adjustContrast > 0) {
        img = adjustContrastGrey(img, adjustContrast)
      }

      val desiredWidth =
        when {
          img.width() >= Constants.LARGE_MODEL_WIDTH -> Constants.LARGE_MODEL_WIDTH
          img.width() >= Constants.MEDIUM_MODEL_WIDTH -> Constants.MEDIUM_MODEL_WIDTH
          else -> if (isVertical) Constants.VERTICAL_SMALL_MODEL_WIDTH else Constants.SMALL_MODEL_WIDTH
        }

      img = ImageProcessor.resizeWithPadding(img, desiredWidth, Constants.MODEL_HEIGHT)
      img.convertTo(img, CvType.CV_32F, 1.0 / 255.0)
      Core.subtract(img, Scalar(0.5), img)
      Core.multiply(img, Scalar(2.0), img)

      return img
    }

    fun cropImageWithBoundingBox(
      image: Mat,
      box: List<BBoxPoint>,
      originalBox: List<BBoxPoint>,
      paddings: Map<String, Any>,
      originalPaddings: Map<String, Any>,
    ): Mat {
      val topLeft = originalBox[0]
      val points = arrayOfNulls<Point>(4)

      for (i in 0 until 4) {
        val cords = box[i]
        cords.x -= paddings["left"]!! as Int
        cords.y -= paddings["top"]!! as Int

        cords.x *= paddings["resizeRatio"]!! as Float
        cords.y *= paddings["resizeRatio"]!! as Float

        cords.x += topLeft.x
        cords.y += topLeft.y

        cords.x -= originalPaddings["left"]!! as Int
        cords.y -= (originalPaddings["top"]!! as Int)

        cords.x *= originalPaddings["resizeRatio"]!! as Float
        cords.y *= originalPaddings["resizeRatio"]!! as Float

        points[i] = Point(cords.x, cords.y)
      }

      val boundingBox = Imgproc.boundingRect(MatOfPoint2f(*points))
      val croppedImage = Mat(image, boundingBox)
      Imgproc.cvtColor(croppedImage, croppedImage, Imgproc.COLOR_BGR2GRAY)
      Imgproc.resize(croppedImage, croppedImage, Size(64.0, 64.0), 0.0, 0.0, Imgproc.INTER_LANCZOS4)
      Imgproc.medianBlur(croppedImage, croppedImage, 1)

      return croppedImage
    }

    fun extractBoundingBox(cords: List<BBoxPoint>): Rect {
      val points = arrayOfNulls<Point>(4)

      for (i in 0 until 4) {
        points[i] = Point(cords[i].x, cords[i].y)
      }

      val boundingBox = Imgproc.boundingRect(MatOfPoint2f(*points))

      return boundingBox
    }

    fun cropSingleCharacter(img: Mat): Mat {
      val histogram = Mat()
      val histSize = MatOfInt(256)
      val range = MatOfFloat(0f, 256f)
      Imgproc.calcHist(
        listOf(img),
        MatOfInt(0),
        Mat(),
        histogram,
        histSize,
        range,
      )

      val midPoint = 256 / 2
      var sumLeft = 0.0
      var sumRight = 0.0
      for (i in 0 until midPoint) {
        sumLeft += histogram.get(i, 0)[0]
      }
      for (i in midPoint until 256) {
        sumRight += histogram.get(i, 0)[0]
      }

      val thresholdType = if (sumLeft < sumRight) Imgproc.THRESH_BINARY_INV else Imgproc.THRESH_BINARY

      val thresh = Mat()
      Imgproc.threshold(img, thresh, 0.0, 255.0, thresholdType + Imgproc.THRESH_OTSU)

      val labels = Mat()
      val stats = Mat()
      val centroids = Mat()
      val numLabels = Imgproc.connectedComponentsWithStats(thresh, labels, stats, centroids, 8)

      val centralThreshold = 0.3
      val height = thresh.rows()
      val width = thresh.cols()
      val minX = centralThreshold * width
      val maxX = (1 - centralThreshold) * width
      val minY = centralThreshold * height
      val maxY = (1 - centralThreshold) * height

      var selectedComponent = -1
      for (i in 1 until numLabels) {
        val area = stats.get(i, Imgproc.CC_STAT_AREA)[0].toInt()
        val cx = centroids.get(i, 0)[0]
        val cy = centroids.get(i, 1)[0]
        if (cx > minX && cx < maxX && cy > minY && cy < maxY && area > Constants.SINGLE_CHARACTER_MIN_SIZE) {
          if (selectedComponent == -1 || area > stats.get(selectedComponent, Imgproc.CC_STAT_AREA)[0]) {
            selectedComponent = i
          }
        }
      }

      val mask = Mat.zeros(img.size(), CvType.CV_8UC1)
      if (selectedComponent != -1) {
        Core.compare(labels, Scalar(selectedComponent.toDouble()), mask, Core.CMP_EQ)
      }

      val resultImage = Mat.zeros(img.size(), img.type())
      img.copyTo(resultImage, mask)

      Core.bitwise_not(resultImage, resultImage)
      return resultImage
    }
  }
}
