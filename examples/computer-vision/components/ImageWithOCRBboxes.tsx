// Import necessary components
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { OCRDetection } from 'react-native-executorch';

interface Props {
  imageUri: string;
  detections: OCRDetection[];
  imageWidth: number;
  imageHeight: number;
}

export default function ImageWithOCRBboxes({
  imageUri,
  detections,
  imageWidth,
  imageHeight,
}: Props) {
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });

  const calculateAdjustedDimensions = () => {
    const imageRatio = imageWidth / imageHeight;
    const layoutRatio = layout.width / layout.height;
    let sx, sy;
    if (imageRatio > layoutRatio) {
      sx = layout.width / imageWidth;
      sy = layout.width / imageRatio / imageHeight;
    } else {
      sy = layout.height / imageHeight;
      sx = (layout.height * imageRatio) / imageWidth;
    }
    return {
      scaleX: sx,
      scaleY: sy,
      offsetX: (layout.width - imageWidth * sx) / 2,
      offsetY: (layout.height - imageHeight * sy) / 2,
    };
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      <Image
        style={styles.image}
        resizeMode="contain"
        source={
          imageUri
            ? { uri: imageUri }
            : require('../assets/icons/executorch_logo.png')
        }
      />
      <Svg style={styles.svgContainer}>
        {detections.map((detection, index) => {
          const { scaleX, scaleY, offsetX, offsetY } =
            calculateAdjustedDimensions();
          const points = detection.bbox.map((point) => ({
            x: point.x * scaleX + offsetX,
            y: point.y * scaleY + offsetY,
          }));

          const pointsString = points
            .map((point) => `${point.x},${point.y}`)
            .join(' ');

          return (
            <Polygon
              key={index}
              points={pointsString}
              fill="none"
              stroke="red"
              strokeWidth="2"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
