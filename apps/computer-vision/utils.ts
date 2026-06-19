import { PermissionsAndroid, Platform } from 'react-native';
import { CameraOptions, launchCamera, launchImageLibrary } from 'react-native-image-picker';

export const getImage = async (useCamera: boolean) => {
  if (useCamera && Platform.OS === 'android') {
    try {
      const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Camera permission denied');
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to request camera permission:', err);
      return;
    }
  }

  const options: CameraOptions = {
    mediaType: 'photo',
  };
  try {
    const output = useCamera ? await launchCamera(options) : await launchImageLibrary(options);

    if (!output.assets || output.assets.length === 0) return;

    return output.assets[0];
  } catch (err) {
    console.error(err);
  }
};
