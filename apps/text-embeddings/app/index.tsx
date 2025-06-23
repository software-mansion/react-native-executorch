import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ColorPalette from '../colors';
import ExecutorchLogo from '../assets/executorch.svg';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ExecutorchLogo width={64} height={64} />
      <Text style={styles.headerText}>Select a demo model</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('text-embeddings/')}
        >
          <Text style={styles.buttonText}>Text embeddings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate('clip-embeddings/')}
        >
          <Text style={styles.buttonText}>Clip embeddings</Text>
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
