import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const getImage = async (
  useCamera: boolean,
  targetWidth = 800
): Promise<string | undefined> => {
  const permissionResult = useCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert(
      'Permission Required',
      useCamera
        ? 'Permission to access camera is required!'
        : 'Permission to access camera roll is required!'
    );
    return;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  };

  const pickerResult = useCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (pickerResult.canceled || !pickerResult.assets[0]) {
    return;
  }

  const asset = pickerResult.assets[0];
  let imageRef = await ImageManipulator.manipulate(asset.uri).renderAsync();

  if (imageRef.width > targetWidth) {
    imageRef = await ImageManipulator.manipulate(asset.uri)
      .resize({ width: targetWidth })
      .renderAsync();
  }

  const result = await imageRef.saveAsync({ format: SaveFormat.PNG });
  return result.uri;
};
