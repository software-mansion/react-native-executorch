import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../components/BottomBar';
import { candy } from '../models/style_transfer';
import { getImageUri } from '../utils';
import { useStyleTransfer } from 'react-native-executorch';
import { View, StyleSheet, Image } from 'react-native';

export const StyleTransferScreen = ({
  imageUri,
  setImageUri,
}: {
  imageUri: string;
  setImageUri: (imageUri: string) => void;
}) => {
  const model = useStyleTransfer({
    modulePath: candy,
  });

  const handleCameraPress = async (isCamera: boolean) => {
    const uri = await getImageUri(isCamera);
    if (typeof uri === 'string') {
      setImageUri(uri as string);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        const output = await model.forward(imageUri);
        setImageUri(output);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!model.isModelReady) {
    return (
      <Spinner
        visible={!model.isModelReady}
        textContent={`Loading the model...`}
      />
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
