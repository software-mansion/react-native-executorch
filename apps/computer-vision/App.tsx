import ScrollPicker from 'react-native-wheel-scrollview-picker';
import ColorPalette from './colors';
import SWMIcon from './assets/icons/swm_icon.svg';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { StyleTransferScreen } from './screens/StyleTransferScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { ClassificationScreen } from './screens/ClassificationScreen';
import { ObjectDetectionScreen } from './screens/ObjectDetectionScreen';
import { OCRScreen } from './screens/OCRScreen';
import { VerticalOCRScreen } from './screens/VerticalOCRScreen';
import { ImageSegmentationScreen } from './screens/ImageSegmentationScreen';

enum ModelType {
  STYLE_TRANSFER,
  OBJECT_DETECTION,
  CLASSIFICATION,
  OCR,
  VERTICAL_OCR,
  IMAGE_SEGMENTATION,
}

export default function App() {
  useFonts({
    medium: require('./assets/fonts/Aeonik-Medium.otf'),
    regular: require('./assets/fonts/Aeonik-Regular.otf'),
  });
  const [selectedMode, setSelectedMode] = useState<ModelType>(
    ModelType.STYLE_TRANSFER
  );
  const [imageUri, setImageUri] = useState('');

  const handleModeChange = (mode: ModelType) => {
    setSelectedMode(mode);
  };

  const renderScreen = () => {
    switch (selectedMode) {
      case ModelType.STYLE_TRANSFER:
        return (
          <StyleTransferScreen imageUri={imageUri} setImageUri={setImageUri} />
        );
      case ModelType.OBJECT_DETECTION:
        return (
          <ObjectDetectionScreen
            imageUri={imageUri}
            setImageUri={setImageUri}
          />
        );
      case ModelType.CLASSIFICATION:
        return (
          <ClassificationScreen imageUri={imageUri} setImageUri={setImageUri} />
        );
      case ModelType.OCR:
        return <OCRScreen imageUri={imageUri} setImageUri={setImageUri} />;
      case ModelType.VERTICAL_OCR:
        return (
          <VerticalOCRScreen imageUri={imageUri} setImageUri={setImageUri} />
        );
      case ModelType.IMAGE_SEGMENTATION:
        return (
          <ImageSegmentationScreen
            imageUri={imageUri}
            setImageUri={setImageUri}
          />
        );
      default:
        return (
          <StyleTransferScreen imageUri={imageUri} setImageUri={setImageUri} />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.topContainer}>
          <SWMIcon width={45} height={45} />
          <View style={styles.wheelPickerContainer}>
            <ScrollPicker
              dataSource={[
                'Style Transfer',
                'Object Detection',
                'Classification',
                'OCR',
                'Vertical OCR',
                'Image Segmentation',
              ]}
              onValueChange={(_, selectedIndex) => {
                handleModeChange(selectedIndex);
              }}
              wrapperHeight={100}
              highlightColor={ColorPalette.primary}
              wrapperBackground="#fff"
              highlightBorderWidth={3}
              itemHeight={40}
              activeItemTextStyle={styles.activeScrollItem}
            />
          </View>
        </View>
        {renderScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topContainer: {
    marginTop: 5,
    height: 145,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wheelPickerContainer: {
    width: '100%',
    height: 100,
  },
  activeScrollItem: {
    color: ColorPalette.primary,
    fontWeight: 'bold',
  },
});
