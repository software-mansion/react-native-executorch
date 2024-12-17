import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { Detection } from 'react-native-executorch';

interface Props {
  imageUri: string;
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
}

export default function ImageWithBboxes({
  imageUri,
  detections,
  imageWidth,
  imageHeight,
}: Props) {
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });

  const calculateAdjustedDimensions = () => {
    const imageRatio = imageWidth / imageHeight;
    const layoutRatio = layout.width / layout.height;

    let sx, sy; // Scale in x and y directions
    if (imageRatio > layoutRatio) {
      // image is more "wide"
      sx = layout.width / imageWidth;
      sy = layout.width / imageRatio / imageHeight;
    } else {
      // image is more "tall"
      sy = layout.height / imageHeight;
      sx = (layout.height * imageRatio) / imageWidth;
    }

    return {
      scaleX: sx,
      scaleY: sy,
      offsetX: (layout.width - imageWidth * sx) / 2, // Centering the image horizontally
      offsetY: (layout.height - imageHeight * sy) / 2, // Centering the image vertically
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
      {detections.map((detection, index) => {
        const { scaleX, scaleY, offsetX, offsetY } =
          calculateAdjustedDimensions();
        const { x1, y1, x2, y2 } = detection.bbox;

        const left = x1 * scaleX + offsetX;
        const top = y1 * scaleY + offsetY;
        const width = (x2 - x1) * scaleX;
        const height = (y2 - y1) * scaleY;

        return (
          <View
            key={index}
            style={[
              styles.bbox,
              { left, top, width, height, borderColor: 'red' },
            ]}
          >
            <Text style={styles.label}>
              {detection.label} ({(detection.score * 100).toFixed(1)}%)
            </Text>
          </View>
        );
      })}
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
  bbox: {
    position: 'absolute',
    borderWidth: 2,
  },
  label: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
