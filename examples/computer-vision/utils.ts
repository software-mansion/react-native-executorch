import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

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
