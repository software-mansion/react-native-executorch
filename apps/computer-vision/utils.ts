import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { SkImage } from '@shopify/react-native-skia';

/**
 * Converts a Skia image into the raw RGBA/HWC image buffer that
 * react-native-executorch vision tasks accept. Throws if the pixel data cannot
 * be read.
 */
export const skImageToBuffer = (image: SkImage) => {
  const pixels = image.readPixels();
  if (!pixels) {
    throw new Error('Failed to read pixels from image');
  }
  if (!(pixels instanceof Uint8Array)) {
    throw new Error('Expected Uint8Array from readPixels');
  }
  return {
    data: pixels,
    width: image.width(),
    height: image.height(),
    format: 'rgba' as const,
    layout: 'hwc' as const,
  };
};

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
