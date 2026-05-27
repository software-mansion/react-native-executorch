import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import ColorPalette from '../colors';
import ExecutorchLogo from '../assets/icons/executorch.svg';

const ROUTES: { label: string; path: string }[] = [
  { label: 'Vision Camera', path: 'vision_camera/' },
  { label: 'Classification', path: 'classification/' },
  { label: 'Semantic Segmentation', path: 'semantic_segmentation/' },
  { label: 'Object Detection', path: 'object_detection/' },
  { label: 'Instance Segmentation', path: 'instance_segmentation/' },
  { label: 'Pose Estimation', path: 'pose_estimation/' },
  { label: 'Segment Anything', path: 'segment_anything/' },
  { label: 'OCR', path: 'ocr/' },
  { label: 'OCR Vertical', path: 'ocr_vertical/' },
  { label: 'Live Text', path: 'live_text/' },
  { label: 'Style Transfer', path: 'style_transfer/' },
  { label: 'Image Generation', path: 'text_to_image/' },
];

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <ExecutorchLogo width={64} height={64} />
      <Text style={styles.headerText}>Select a demo model</Text>
      <View style={styles.buttonContainer}>
        {ROUTES.map(({ label, path }) => (
          <Pressable
            key={path}
            onPress={() => router.navigate(path)}
            style={({ pressed }) => [
              styles.button,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.buttonText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
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
  scroll: {
    flex: 1,
    backgroundColor: ColorPalette.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  headerText: {
    fontSize: fontSizes.xxl,
    color: ColorPalette.text,
    marginTop: 24,
    marginBottom: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorPalette.buttonBg,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: ColorPalette.buttonBg,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
  },
  buttonText: {
    color: ColorPalette.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
