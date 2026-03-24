import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Detection } from 'react-native-executorch';
import BoundingBoxes from './BoundingBoxes';

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

    let sx, sy;
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
      offsetX: (layout.width - imageWidth * sx) / 2,
      offsetY: (layout.height - imageHeight * sy) / 2,
    };
  };

  const { scaleX, scaleY, offsetX, offsetY } = calculateAdjustedDimensions();

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
      <BoundingBoxes
        detections={detections}
        scaleX={scaleX}
        scaleY={scaleY}
        offsetX={offsetX}
        offsetY={offsetY}
        containerWidth={layout.width}
      />
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
});
