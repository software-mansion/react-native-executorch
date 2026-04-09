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
          onPress={() => router.navigate('vision_camera/')}
        >
          <Text style={styles.buttonText}>Vision Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('webrtc_test/')}
        >
          <Text style={styles.buttonText}>WebRTC Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('classification/')}
        >
          <Text style={styles.buttonText}>Classification</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('semantic_segmentation/')}
        >
          <Text style={styles.buttonText}>Semantic Segmentation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('object_detection/')}
        >
          <Text style={styles.buttonText}>Object Detection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('instance_segmentation/')}
        >
          <Text style={styles.buttonText}>Instance Segmentation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('pose_estimation/')}
        >
          <Text style={styles.buttonText}>Pose Estimation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('ocr/')}
        >
          <Text style={styles.buttonText}>OCR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('ocr_vertical/')}
        >
          <Text style={styles.buttonText}>OCR Vertical</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('style_transfer/')}
        >
          <Text style={styles.buttonText}>Style Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('text_to_image/')}
        >
          <Text style={styles.buttonText}>Image Generation</Text>
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
