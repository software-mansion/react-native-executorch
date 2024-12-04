import { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Button,
} from 'react-native';
import { getImageUri } from '../utils/utils';
import { useStyleTransfer } from 'react-native-executorch';

export default function StyleTransfer() {
  const [imageUri, setImageUri] = useState('');
  const [styleImageUri, setStyleImageUri] = useState('');

  const model = useStyleTransfer({
    modulePath: require('../assets/style_transfer/ios/__candy_coreml_all.pte'),
  });

  const handleCameraPress = async (isCamera: boolean) => {
    const imageUri = await getImageUri(isCamera);
    if (typeof imageUri === 'string') {
      setImageUri(imageUri as string);
      setStyleImageUri(imageUri as string);
    }
  };
  if (model.isModelLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <Text>Loading model...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.titleText}>Image editor</Text>
        <View style={styles.imageContainer}>
          {imageUri && (
            <Image
              source={{
                uri: imageUri,
              }}
              style={styles.imageComponent}
            />
          )}
        </View>
        <View style={styles.managePhotoContainer}>
          <TouchableOpacity onPress={async () => await handleCameraPress(true)}>
            <Text>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => await handleCameraPress(false)}
          >
            <Text>Gallery</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomContainer}>
          <Text style={styles.filtersText}>Filters</Text>
          <Button
            title={'transfer'}
            onPress={async () => {
              try {
                const output = await model.forward(imageUri);
                setImageUri(output);
              } catch (e) {
                console.log('Error');
              }
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 4,
    borderColor: 'navy',
  },
  titleText: {
    fontSize: 24,
    color: 'navy',
    marginVertical: '5%',
  },
  imageContainer: {
    width: '90%',
    height: '65%',
  },
  imageComponent: {
    height: '100%',
    width: '100%',
    borderRadius: 10,
  },
  bottomContainer: {
    height: '15%',
    width: '100%',
    borderTopColor: 'navy',
    borderTopWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stylePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '75%',
    width: '90%',
    backgroundColor: 'white',
  },
  stylePickerImageBackground: {
    width: '100%',
    height: '100%',
  },
  stylePickerTouchableOpacity: {
    width: '20%',
    height: '100%',
  },
  stylePickerButtonImageStyle: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  filtersText: {
    color: 'navy',
    fontSize: 20,
    marginVertical: '2%',
  },
  managePhotoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
    marginTop: '5%',
    height: '5%',
    marginBottom: '5%',
  },
  selectedBorderStyle: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderColor: 'navy',
    borderRadius: 10,
    padding: 2,
  },
});
