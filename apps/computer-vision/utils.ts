import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

export const getImage = async (useCamera: boolean) => {
  const options: CameraOptions = {
    mediaType: 'photo',
  };
  try {
    const output = useCamera
      ? await launchCamera(options)
      : await launchImageLibrary(options);

    if (!output.assets || output.assets.length === 0) return;

    return output.assets[0];
  } catch (err) {
    console.error(err);
  }
};
