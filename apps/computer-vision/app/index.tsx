import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ColorPalette from '../colors';
import ExecutorchLogo from '../assets/icons/executorch.svg';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ExecutorchLogo width={64} height={64} />
      <Text style={styles.headerText}>Select a demo model</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('classification/')}
        >
          <Text style={styles.buttonText}>Classification</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('image_segmentation/')}
        >
          <Text style={styles.buttonText}>Image Segmentation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('object_detection/')}
        >
          <Text style={styles.buttonText}>Object Detection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('ocr/')}
        >
          <Text style={styles.buttonText}>OCR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('style_transfer/')}
        >
          <Text style={styles.buttonText}>Style Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('vertical_ocr/')}
        >
          <Text style={styles.buttonText}>Vertical OCR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const fontSizes = {
  xxl: 34,
  xl: 22,
  lg: 18,
  md: 16,
  sm: 14,
  xs: 12,
  xxs: 10,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: fontSizes.lg,
    color: ColorPalette.strongPrimary,
    margin: 20,
  },
  buttonContainer: {
    width: '80%',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  button: {
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: fontSizes.md,
  },
});
