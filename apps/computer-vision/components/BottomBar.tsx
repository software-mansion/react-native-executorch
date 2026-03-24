import ColorPalette from '../colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DeviceInfo from 'react-native-device-info';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BottomBar = ({
  handleCameraPress,
  runForward,
  hasImage = true,
}: {
  handleCameraPress: (isCamera: boolean) => void;
  runForward: () => void;
  hasImage?: boolean;
}) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.bottomContainer, { paddingBottom: bottom || 16 }]}>
      <View style={styles.bottomIconsContainer}>
        <TouchableOpacity onPress={() => handleCameraPress(false)}>
          <FontAwesome name="photo" size={24} color={ColorPalette.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            !DeviceInfo.isEmulatorSync() && handleCameraPress(true)
          }
        >
          <FontAwesome
            name="camera"
            size={24}
            color={DeviceInfo.isEmulatorSync() ? '#888' : ColorPalette.primary}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, !hasImage && styles.buttonDisabled]}
        onPress={runForward}
        disabled={!hasImage}
      >
        <Text style={styles.buttonText}>
          {hasImage ? 'Run model' : 'Pick an image to run the model'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    width: '100%',
    gap: 15,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  bottomIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorPalette.primary,
    color: '#fff',
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
