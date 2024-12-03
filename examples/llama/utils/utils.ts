import { NativeModules } from 'react-native';
import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

const { StyleTransferModule } = NativeModules;

export const applyStyle = async (inputUri: string, styleName: string) => {
  try {
    const resultUri = await StyleTransferModule.applyStyleTransfer(
      styleName,
      inputUri
    );
    return resultUri;
  } catch (err) {
    console.error(err);
  }
};

export const getImageUri = async (useCamera: boolean) => {
  const options: CameraOptions = {
    mediaType: 'photo',
  };
  try {
    const output = useCamera
      ? await launchCamera(options)
      : await launchImageLibrary(options);
    if (!output.assets || output.assets.length === 0) return;

    const imageUri = output.assets[0].uri;
    if (!imageUri) return;
    return imageUri;
  } catch (err) {
    console.error(err);
  }
};
