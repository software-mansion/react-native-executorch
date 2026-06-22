import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Skia, SkImage } from '@shopify/react-native-skia';

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

export const loadSkImage = async (uri: string, targetWidth = 800): Promise<SkImage> => {
  const result = await ImageManipulator.manipulate(uri)
    .resize({ width: targetWidth })
    .renderAsync()
    .then((res) => res.saveAsync({ format: SaveFormat.PNG }));

  const encoded = await Skia.Data.fromURI(result.uri);
  try {
    const img = Skia.Image.MakeImageFromEncoded(encoded);
    if (!img) throw new Error('Failed to create SkImage');
    return img;
  } finally {
    encoded.dispose();
  }
};
