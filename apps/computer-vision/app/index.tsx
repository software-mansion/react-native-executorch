import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette } from '../theme';
import ExecutorchLogo from '../assets/icons/executorch.svg';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    // The list is taller than the viewport on shorter phones, so it scrolls
    // rather than running under the system navigation bar.
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
    >
      <ExecutorchLogo width={64} height={64} />
      <Text style={styles.headerText}>Select a demo model</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('classification/')}>
          <Text style={styles.buttonText}>Classification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('imageEmbeddings/')}>
          <Text style={styles.buttonText}>Image Embeddings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('detection/')}>
          <Text style={styles.buttonText}>Object Detection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('styleTransfer/')}>
          <Text style={styles.buttonText}>Style Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('textToImage/')}>
          <Text style={styles.buttonText}>Text to Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('segmentation/')}>
          <Text style={styles.buttonText}>Semantic Segmentation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('instanceSegmentation/')}
        >
          <Text style={styles.buttonText}>Instance Segmentation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('keypoint/')}>
          <Text style={styles.buttonText}>Keypoint Detection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('ocr/')}>
          <Text style={styles.buttonText}>OCR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.navigate('inspect/')}>
          <Text style={styles.buttonText}>Model Inspector</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerText: {
    fontSize: 18,
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
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
