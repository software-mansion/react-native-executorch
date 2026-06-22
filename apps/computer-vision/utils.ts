import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const getImage = async (
  useCamera: boolean
): Promise<ImagePicker.ImagePickerAsset | undefined> => {
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

  return pickerResult.assets[0];
};

export const prepareImage = async (uri: string, targetWidth = 800): Promise<string> => {
  let imageRef = await ImageManipulator.manipulate(uri).renderAsync();

  if (imageRef.width > targetWidth) {
    imageRef = await ImageManipulator.manipulate(uri).resize({ width: targetWidth }).renderAsync();
  }

  const result = await imageRef.saveAsync({ format: SaveFormat.PNG });
  return result.uri;
};
