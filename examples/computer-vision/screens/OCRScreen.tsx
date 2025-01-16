import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../components/BottomBar';
import { getImage } from '../utils';
import { useOCR } from 'react-native-executorch';
import { View, StyleSheet, Image } from 'react-native';

export const OCRScreen = ({
  imageUri,
  setImageUri,
}: {
  imageUri: string;
  setImageUri: (imageUri: string) => void;
}) => {
  const model = useOCR({
    detectorSource: require('../assets/models/xnnpack_craft.pte'),
    recognizerSources: [require('../assets/models/xnnpack_crnn_128.pte')],
  });

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const uri = image?.uri;
    if (typeof uri === 'string') {
      setImageUri(uri as string);
    }
  };

  const shape = [1, 1, 64, 128];
  const input = new Float32Array(shape[1] * shape[2] * shape[3]);

  for (let i = 0; i < shape[1] * shape[2] * shape[3]; i++) {
    input[i] = Math.random() * 255;
  }

  const runForward = async () => {
    try {
      const output = await model.forward(imageUri);
      console.log(output[0]);
      console.log(output[1]);
    } catch (e) {
      console.error(e);
    }
  };

  if (!model.isReady) {
    return (
      <Spinner visible={!model.isReady} textContent={`Loading the model...`} />
    );
  }

  return (
    <>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={
            imageUri
              ? { uri: imageUri }
              : require('../assets/icons/executorch_logo.png')
          }
        />
      </View>
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
      />
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
});
